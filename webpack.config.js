const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const PRODUCTION = !!process.env.PRODUCTION;

module.exports = {
  mode: PRODUCTION ? 'production' : 'development',
  devtool: PRODUCTION ? false : 'inline-source-map',
  devServer: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    https: true,
    host: '0.0.0.0',
    port: 8090,
    watchFiles: ['src/**/*'],
  },
  entry: {
    app: './src/demos/draw/tfjs_webgl_entry.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/demos/draw/index.html',
      filename: 'index.html',
      chunks: ['app'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm', to: '[name][ext]' },
        { from: 'models/lan', to: 'lan/' },
        { from: 'models/box', to: 'box/' },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
