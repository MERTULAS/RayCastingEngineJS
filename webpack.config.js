const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const isProduction = argv.mode === 'production';

  return {
    entry: './index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'index.html'
      }),

      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development'),
        'process.env.ASSETS_PATH': JSON.stringify(isDevelopment ? '/assets' : './assets'),
        'process.env.DATA_PATH': JSON.stringify(isDevelopment ? '/data' : './data'),  
        'process.env.DEBUG': JSON.stringify(isDevelopment),
        '__DEV__': isDevelopment,
        '__PROD__': isProduction
      }),

      ...(isProduction ? [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'assets'),
              to: path.resolve(__dirname, 'dist/assets'),
            },
            {
              from: path.resolve(__dirname, 'data'),
              to: path.resolve(__dirname, 'dist/data'),
            }
          ],
        })
      ] : [])
    ],
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'assets'),
          publicPath: '/assets',
        },
        {
          directory: path.join(__dirname, 'data'),
          publicPath: '/data'
        }
      ],
      hot: true,
      open: true,
    },
    mode: argv.mode || 'development',
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
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name][ext]'
          }
        }
      ]
    }
  };
};
