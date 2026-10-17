const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { Compilation } = require('webpack');

// File names contain a hash of their content, so browsers can cache them for long and still get new versions
const HASH = '[contenthash:8]';

// Replaces references to assets in index.html (e.g. "js/scripts.js") with their hashed names
class HashedAssetsInHtmlPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('HashedAssetsInHtmlPlugin', (compilation) => {
      // Run after webpack has computed the final content hashes
      compilation.hooks.processAssets.tap({ name: 'HashedAssetsInHtmlPlugin', stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER }, (assets) => {
        const hashed = {};
        for (const name of Object.keys(assets)) {
          const plain = name.replace(/\.[0-9a-f]{8}(\.[a-z]+)$/, '$1');
          if (plain !== name) hashed[plain] = name;
        }
        const html = assets['index.html'].source().toString().replace(/(src|href)="([^"?#]+)"/g,
          (match, attr, file) => hashed[file] ? `${attr}="${hashed[file]}"` : match);
        compilation.updateAsset('index.html', new compiler.webpack.sources.RawSource(html));
      });
    });
  }
}

module.exports = {
  entry: {
    ChannelsDB: './ChannelsDB/src/App.tsx',
  },
  output: {
    filename: `[name]-Core.${HASH}.js`,
    path: path.resolve(__dirname, 'dist/ChannelsDB'),
    clean: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: './ChannelsDB/js/scripts.js', to: `js/[name].${HASH}[ext]` },
        { from: './ChannelsDB/css/styles.css', to: `css/[name].${HASH}[ext]` },
        { from: './ChannelsDB/fonts/*', to: () => { return `fonts/[name][ext]`;} },
        { from: './ChannelsDB/images/*', to: () => { return `images/[name][ext]`;} },
        { from: './ChannelsDB/index.html', to: 'index.html' },
      ]
    }),
    new HashedAssetsInHtmlPlugin(),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.scss', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        sideEffects: true,
      },
    ],
  },
};