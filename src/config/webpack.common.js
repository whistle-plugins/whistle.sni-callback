const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, 'src');

module.exports = {
  entry: {
    index: ['babel-polyfill', path.resolve(srcDir, 'index')],
  },
  output: {
    path: path.resolve(rootDir, 'public'),
    filename: '[name].[hash].js',
  },
  resolve: {
    extensions: ['.js', '.jsx', 'json'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          'babel-loader',
        ],
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader',
        ],
      },
    ],
  },
  devtool: 'none',
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: '自定义证书',
      chunks: ['index'],
      template: path.resolve(srcDir, 'config/template.html'),
    }),
  ],
};
