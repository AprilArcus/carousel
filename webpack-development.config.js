/* eslint-env node */
/* eslint-disable quotes */
var webpack = require('webpack'),
    path = require('path');

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './scripts/index'
  ],
  output: {
    path: path.resolve('scripts'),
    filename: 'bundle.js',
    publicPath: '/scripts/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loaders: ['react-hot', 'babel-loader?experimental&optional=runtime'], exclude: /node_modules/ },
      { test: /\.js?$/, loader: 'babel-loader?experimental&optional=runtime', exclude: /node_modules/ }
    ]
  }
};
