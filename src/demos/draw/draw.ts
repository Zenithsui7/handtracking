import {
  CreateMaxFpsMaxResStream,
  MediaStreamErrorEnum, 
  CreateVideoElementFromStream,
  IModelDownloadProgressCb,
  ITrackResultCb,
  ITrackSource,
  IEngineConfig,
} from '../../entry';

import {
  VideoLayer, 
  PointLayer, 
  DynamicPathLayer, 
  LayerStack, 
  LandmarkLayer, 
  FpsLayer
} from '../../util/layers';

import {IsMobile} from '../../util/mobile_detect';
import {ScaleResolutionToWidth} from '../../util/stream_helper';
import {ExponentialMovingAverage} from '../../util/ema';

const BORDER_PADDING_FACTOR = 0.05;
const VIDEO_WIDTH_FACTOR = 0.66;

interface IDownloadAndStartEngineCb {
  (
    src: ITrackSource,
    config: IEngineConfig,
    progressCb: IModelDownloadProgressCb, 
    resultCb: ITrackResultCb
  ) : void
}

export async function CreateDrawDemo(startCb: IDownloadAndStartEngineCb) {
  if (IsMobile({tablet: true})) {
    document.getElementById('mobile').style.display = '';
  }

  const progressCb = (received: number, total: number) => {
    const progress = received / total;
    document.getElementById('progress').innerText = `${Math.round(progress * 100)}%`;
  };
  
  const config = {
    mirrorX: true,
    padding: BORDER_PADDING_FACTOR,
  };

  const streamRes = await CreateMaxFpsMaxResStream();

  if (streamRes.error) {
    if (streamRes.error === MediaStreamErrorEnum.NOT_ALLOWED_ERROR) {
      LogError('You denied camera access. Refresh the page if this was a mistake and you\'d like to try again.');
      return;
    } else if (streamRes.error === MediaStreamErrorEnum.NOT_FOUND_ERROR) {
      LogError('No camera found. Connect a camera and refresh the page to try again.');
      return;
    } else {
      LogError(`Something went wrong when trying to access your camera (${streamRes.error}). Refresh to try again.`);
      return;
    }
  }

  document.getElementById('logs').style.display = 'none';

  const src = CreateVideoElementFromStream(streamRes.stream);

  let width = src.width;
  let height = src.height;

  const targetWidth = window.innerWidth * VIDEO_WIDTH_FACTOR;
  ({width, height} = ScaleResolutionToWidth({width, height}, targetWidth));

  const {stack, pointLayer, pathLayer, landmarkLayer, fpsLayer} =
      CreateLayerStack(src, width, height);
  document.getElementById('canvas').appendChild(stack.GetEl());

  const pos = new ExponentialCoordinateAverage(0.85);

  startCb(src, config, progressCb, e => {
    fpsLayer.RegisterCall();
    if (Math.round(e.isHandPresentProb)) {
      const cursorPos = pos.Add(ComputeCursorPositionFromCoordinates(e.coordinates));

      pointLayer.DrawPoint(cursorPos[0], cursorPos[1]);
      pointLayer.Render();

      if (Math.round(e.poses.pinchProb)) {
        pathLayer.AddNode(cursorPos[0], cursorPos[1]);
        pathLayer.Render();
      } else {
        pathLayer.EndPath();
      }

      if (Math.round(e.poses.fistProb)) {
        pathLayer.Clear();
        pathLayer.Render();
      }

      landmarkLayer.Draw(e.coordinates);
      landmarkLayer.Render();
    } else {
      pointLayer.Clear();
      pointLayer.Render();
      pathLayer.EndPath();
      landmarkLayer.Clear();
      landmarkLayer.Render();
    }
  });
}

class ExponentialCoordinateAverage {
  private xAvg_: ExponentialMovingAverage;
  private yAvg_: ExponentialMovingAverage;

  constructor(alpha: number) {
    this.xAvg_ = new ExponentialMovingAverage(alpha);
    this.yAvg_ = new ExponentialMovingAverage(alpha);
  }

  Add(coord: number[]) {
    return [this.xAvg_.Add(coord[0]), this.yAvg_.Add(coord[1])];
  }
}

function ComputeCursorPositionFromCoordinates(coords: number[][]) : number[] {
  return [(coords[3][0] + coords[7][0]) / 2, (coords[3][1] + coords[7][1]) / 2];
}

function LogError(error: string) {
  document.getElementById('error').innerText = error;
}

function CreateLayerStack(video: HTMLVideoElement, width: number, height: number) {
  const stack = new LayerStack({ width, height, outline: '2px solid white' });

  const videoLayer = new VideoLayer({
    width, height,
    virtuallyFlipHorizontal: true,
    crop: BORDER_PADDING_FACTOR,
  }, video);
  stack.AddLayer(videoLayer);

  const pointLayer = new PointLayer({
    width, height,
    color: '#FF5B5B',
    radius: 8,
    fill: true,
  });
  stack.AddLayer(pointLayer);

  const pathLayer = new DynamicPathLayer({
    pathLayerConfig: {
      width, height,
      numSmoothPoints: 10,
      color: '#00FFFF',
      lineWidth: 20,
    }
  });
  stack.AddLayer(pathLayer);

  const landmarkLayer = new LandmarkLayer({ width, height });
  stack.AddLayer(landmarkLayer);

  const fpsLayer = new FpsLayer({ width, height });
  stack.AddLayer(fpsLayer);

  return {stack, videoLayer, pointLayer, pathLayer, landmarkLayer, fpsLayer};
}
