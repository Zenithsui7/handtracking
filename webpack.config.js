const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const PRODUCTION = process.env.NODE_ENV === 'production';

// Only copy model files if they exist (downloaded via download_models.sh)
const copyPatterns = [
  { from: 'node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm', to: '[name][ext]' },
];

if (fs.existsSync(path.resolve(__dirname, 'models/lan'))) {
  copyPatterns.push({ from: 'models/lan', to: 'lan/' });
}
if (fs.existsSync(path.resolve(__dirname, 'models/box'))) {
  copyPatterns.push({ from: 'models/box', to: 'box/' });
}

module.exports = {
  mode: PRODUCTION ? 'production' : 'development',
  devtool: PRODUCTION ? false : 'inline-source-map',
  devServer: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    server: 'https',
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
    new CopyWebpackPlugin({ patterns: copyPatterns }),
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
