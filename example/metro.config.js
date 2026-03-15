const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
	unstable_enableSymlinks: true,
	disableHierarchicalLookup: true,
	nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
	extraNodeModules: {
	  'react-native-system-emoji-picker': workspaceRoot,
	  react: path.resolve(projectRoot, 'node_modules/react'),
	  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
	},
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
