const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html'
    })
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'src/sprites'),
        publicPath: '/sprites',
      }
    ],
  },  
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  }
};
