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
