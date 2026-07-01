const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const projectRoot = escapeRegex(path.resolve(__dirname).replace(/\\/g, '/'));

// Block only this app's build/output folders — not node_modules/*/dist (e.g. whatwg-fetch).
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  new RegExp(`${projectRoot}/dist/`),
  new RegExp(`${projectRoot}/web-build/`),
  new RegExp(`${projectRoot}/legacy/`),
  new RegExp(`${projectRoot}/functions/node_modules/`),
];

config.watchFolders = [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'assets')];
config.maxWorkers = 2;
config.watchman = true;

module.exports = config;
