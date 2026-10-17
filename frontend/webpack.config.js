const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { Compilation } = require('webpack');

// File names contain a hash of their content, so browsers can cache them for long and still get new versions
const HASH = '[contenthash:8]';

// Replaces references to assets in the HTML pages (e.g. "assets/js/search.js") with their hashed names
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
        for (const name of Object.keys(assets).filter((name) => name.endsWith('.html'))) {
          // Attribute values may be unquoted, as webpack minifies the HTML before this runs
          const html = assets[name].source().toString().replace(/(src|href)=("?)([^"\s>?#]+)\2/g,
            (match, attr, quote, file) => hashed[file] ? `${attr}=${quote}${hashed[file]}${quote}` : match);
          compilation.updateAsset(name, new compiler.webpack.sources.RawSource(html));
        }
      });
    });
  }
}

module.exports = {
  entry: {
    search: './src/Index.tsx',
  },
  output: {
    filename: `assets/js/[name].${HASH}.js`,
    path: path.resolve(__dirname, 'dist'),
    // The pages call ChannelsDB.renderUI(...)
    library: { name: 'ChannelsDB', type: 'window' },
    clean: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      // Copied as they are: newer webpack versions minify HTML and CSS by default, which rounds
      // Bootstrap's line heights (e.g. 1.42857143) and shifts the layout by a pixel
      patterns: [
        { from: '*.html', info: { minimized: true } },
        { from: 'assets/img', to: 'assets/img' },
        { from: 'assets/fonts', to: 'assets/fonts' },
        { from: 'assets/css/bootstrap.min.css', to: `assets/css/[name].${HASH}[ext]`, info: { minimized: true } },
        { from: 'assets/css/bootstrap.min.css.map', to: 'assets/css/[name][ext]' },
        { from: 'assets/css/channelsdb.css', to: `assets/css/[name].${HASH}[ext]`, info: { minimized: true } },
      ],
    }),
    new HashedAssetsInHtmlPlugin(),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
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
};
