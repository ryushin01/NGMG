/* global jest */
jest.mock('expo-secure-store', () => ({ getItem: () => 'test-key', setItem: () => undefined }));
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const map = new Map();
    return {
      getString: (key) => map.get(key),
      set: (key, value) => map.set(key, value),
      remove: (key) => map.delete(key),
    };
  },
}));
// 네이티브 Worklets가 없는 Jest에서는 애니메이션 드라이버를 쓰지 않습니다.
jest.mock('@tamagui/animations-reanimated', () => ({ createAnimations: () => undefined }));
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: () => null,
  Marker: () => null,
}));
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: ({ children }) => children,
  KeyboardStickyView: ({ children }) => children,
  KeyboardProvider: ({ children }) => children,
}));
// 데모 백엔드의 비밀번호 해시와 id는 네이티브 모듈 대신 Node의 crypto로 만듭니다.
jest.mock('expo-crypto', () => {
  const crypto = jest.requireActual('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    randomUUID: () => crypto.randomUUID(),
    digestStringAsync: async (_algorithm, data) =>
      crypto.createHash('sha256').update(data).digest('hex'),
  };
});
