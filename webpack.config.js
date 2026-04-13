//@ts-check

'use strict';
const fs = require('fs');
const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node',
  mode: 'none',

  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },

  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
          // Copier package.json dans dist
          fs.copyFileSync(
            path.resolve(__dirname, 'package.json'),
            path.resolve(__dirname, 'dist', 'package.json')
          );

          // Copier README.md
          if (fs.existsSync(path.resolve(__dirname, 'README.md'))) {
            fs.copyFileSync(
              path.resolve(__dirname, 'README.md'),
              path.resolve(__dirname, 'dist', 'README.md')
            );
          }

          // Copier CHANGELOG.md
          if (fs.existsSync(path.resolve(__dirname, 'CHANGELOG.md'))) {
            fs.copyFileSync(
              path.resolve(__dirname, 'CHANGELOG.md'),
              path.resolve(__dirname, 'dist', 'CHANGELOG.md')
            );
          }

          // Copier LICENSE s'il existe
          if (fs.existsSync(path.resolve(__dirname, 'LICENSE'))) {
            fs.copyFileSync(
              path.resolve(__dirname, 'LICENSE'),
              path.resolve(__dirname, 'dist', 'LICENSE')
            );
          }

          // ⭐ COPIER LE DOSSIER MEDIA (LE PLUS IMPORTANT !)
          const mediaSource = path.resolve(__dirname, 'media');
          const mediaDest = path.resolve(__dirname, 'dist', 'media');

          if (fs.existsSync(mediaSource)) {
            copyDir(mediaSource, mediaDest);
          } else {

            // Créer un dossier media par défaut avec une icône
            fs.mkdirSync(mediaDest, { recursive: true });

            const defaultIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="10,17 12,9 14,18"/>
                                    <line x1="15" y1="9" x2="20" y2="9"/>
                                    <line x1="15" y1="15" x2="20" y2="15"/>
                                    <line x1="20" y1="9" x2="16" y2="15"/>
                                  </svg>`;

            fs.writeFileSync(path.join(mediaDest, 'icon.svg'), defaultIcon);
          }
        });
      }
    }
  ],
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log",
  },
};

// Fonction pour copier récursivement un dossier
/**
 * @typedef {import('fs').Stats} FsStats
 *
 * @typedef {Object} DirEntry
 * @property {string} name
 * @property {string} srcPath
 * @property {string} destPath
 * @property {FsStats} stats
 *
 * @callback CopyDirFn
 * @param {string} source
 * @param {string} dest
 * @returns {void}
 */

/** @type {CopyDirFn} */
/**
 * Fonction pour copier récursivement un dossier
 * @param {string} source
 * @param {string} dest
 * @returns {void}
 */
function copyDir(source, dest) {
  // Créer le dossier de destination s'il n'existe pas
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Lire les éléments du dossier source
  /** @type {string[]} */
  const items = fs.readdirSync(source);

  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(dest, item);

    /** @type {FsStats} */
    const stat = fs.lstatSync(srcPath);

    if (stat.isDirectory()) {
      // Si c'est un dossier, copier récursivement
      copyDir(srcPath, destPath);
    } else {
      // Si c'est un fichier, le copier
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = [ extensionConfig ];