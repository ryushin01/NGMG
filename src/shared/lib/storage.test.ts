import * as SecureStore from 'expo-secure-store';
import { createStore } from './storage';

it('키체인을 쓸 수 없어도 메모리 저장소로 동작합니다', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(SecureStore, 'getItem').mockImplementation(() => {
    throw new Error('필요한 권한이 존재하지 않습니다.');
  });
  const store = createStore();
  store.set('k', 'v');
  expect(store.getString('k')).toBe('v');
  store.remove('k');
  expect(store.getString('k')).toBeUndefined();
  expect(warn).toHaveBeenCalled();
  jest.restoreAllMocks();
});
