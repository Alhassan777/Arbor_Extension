const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    // Use production version with real chat tracking
    content: './src/content/content-production.ts',
    background: './src/background/background.ts',
    options: './src/options/options.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  experiments: {
    topLevelAwait: true,
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: (chunk) => {
        // Don't code-split the background script
        // Service workers can't load dynamic chunks via import()
        // Bundle everything into background.js
        return chunk.name !== 'background';
      },
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public', to: '.', noErrorOnMissing: true },
        {
          from: 'src/content/sidebar.html',
          to: 'sidebar.html',
          noErrorOnMissing: true
        },
        {
          from: 'src/options/options.html',
          to: 'options.html',
        },
        {
          from: 'src/options/options.css',
          to: 'options.css',
        },
        {
          from: 'PRIVACY_POLICY.md',
          to: 'PRIVACY_POLICY.md',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'inline-source-map',
};
