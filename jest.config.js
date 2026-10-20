module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    '^@notifee/react-native$': '<rootDir>/node_modules/@notifee/react-native/jest-mock.js',
    '^@sayem314/react-native-keep-awake$': '<rootDir>/__mocks__/keepAwakeMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@notifee|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
};
