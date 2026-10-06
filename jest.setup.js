// Jest setup file
import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Firestore
jest.mock('./src/services/firebaseClient', () => ({
  db: {},
  auth: {},
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock haptics
jest.mock('./src/utils/haptics', () => ({
  HapticTap: {
    light: jest.fn(),
    medium: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
