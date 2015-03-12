/* eslint-env node */
/* eslint-disable quotes */
var webpack = require('webpack'),
    path = require('path');

module.exports = {
  devtool: 'eval',
  entry: [
    './scripts/index'
  ],
  output: {
    path: path.resolve('scripts'),
    filename: 'bundle.js',
    publicPath: '/scripts/'
  },
  plugins: [
    new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } }),
    new webpack.optimize.UglifyJsPlugin()
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.(js|jsx)?$/, loaders: ['babel-loader?experimental&optional=runtime'], exclude: /node_modules/ }
    ]
  }
};
