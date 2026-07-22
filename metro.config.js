const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const projectRoot = escapeRegex(path.resolve(__dirname).replace(/\\/g, '/'));

// Block server-side node dependencies like pngjs that trigger EMFILE on Windows
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  qrcode: path.resolve(__dirname, 'node_modules/qrcode/lib/browser.js'),
};

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  new RegExp(`${projectRoot}/dist/`),
  new RegExp(`${projectRoot}/web-build/`),
  new RegExp(`${projectRoot}/legacy/`),
  new RegExp(`${projectRoot}/functions/node_modules/`),
  new RegExp(`${projectRoot}/print-bridge/node_modules/`),
  new RegExp(/node_modules[/\\]pngjs[/\\].*/),
];

config.maxWorkers = 2;

module.exports = config;
