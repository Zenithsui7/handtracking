declare module 'meshline' {
  import * as THREE from 'three';

  export class MeshLine {
    geometry: THREE.BufferGeometry;
    setPoints(points: number[] | Float32Array | THREE.Vector3[]): void;
    setGeometry(geometry: THREE.BufferGeometry): void;
  }

  export interface MeshLineMaterialParameters extends THREE.ShaderMaterialParameters {
    color?: THREE.ColorRepresentation;
    lineWidth?: number;
    resolution?: THREE.Vector2;
    sizeAttenuation?: boolean;
    dashArray?: number;
    dashOffset?: number;
    dashRatio?: number;
    opacity?: number;
    alphaTest?: number;
    transparent?: boolean;
    depthTest?: boolean;
    depthWrite?: boolean;
    useMap?: boolean;
    map?: THREE.Texture;
    repeat?: THREE.Vector2;
  }

  export class MeshLineMaterial extends THREE.ShaderMaterial {
    constructor(parameters?: MeshLineMaterialParameters);
    lineWidth: number;
    color: THREE.Color;
    resolution: THREE.Vector2;
  }
}
