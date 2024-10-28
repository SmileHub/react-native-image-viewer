// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    // Add your external directory as a module
    'react-native-image-viewer': path.resolve(__dirname, '../built'),
    // Explicitly map 'react' to the node_modules of the project
    'react': path.resolve(__dirname, 'node_modules/react'),
    'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    '@likashefqet/react-native-image-zoom': path.resolve(__dirname, '../node_modules/@likashefqet/react-native-image-zoom'),

  },
};

config.watchFolders = [
  ...config.watchFolders || [],
  // Add the external directory to the watch folders
  path.resolve(__dirname, '../built'),
  path.resolve(__dirname, '../node_modules'),//for  '@likashefqet/react-native-image-zoom'
];

module.exports = config;
