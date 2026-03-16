module.exports = {
  preset: 'react-native',
  moduleDirectories: [
    'node_modules',
    // Ensure modules required from the linked package resolve to this app's
    // dependencies instead of looking next to the symlink target.
    '<rootDir>/node_modules',
  ],
};
