import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';

const KEY_NAME = 'ngmg.mmkv.key';

type KeyValueStore = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => unknown;
};

/** 암호화 키는 키체인에 두고, 세션과 캐시는 암호화한 MMKV에 저장합니다. */
const getEncryptionKey = () => {
  const existing = SecureStore.getItem(KEY_NAME);
  if (existing) return existing;
  const created = Crypto.randomUUID().replaceAll('-', '').slice(0, 16);
  SecureStore.setItem(KEY_NAME, created);
  return created;
};

const createMemoryStore = (): KeyValueStore => {
  const values = new Map<string, string>();
  return {
    getString: (key) => values.get(key),
    set: (key, value) => values.set(key, value),
    remove: (key) => values.delete(key),
  };
};

/**
 * 키체인을 쓸 수 없어도 앱이 시작되도록 합니다.
 * 이때는 암호화하지 않은 채 디스크에 남기지 않고 메모리에만 보관하므로, 앱을 끄면 다시 로그인합니다.
 */
export const createStore = (): KeyValueStore => {
  try {
    return createMMKV({ id: 'ngmg', encryptionKey: getEncryptionKey() });
  } catch (error) {
    console.warn('보안 저장소를 열지 못해 메모리 저장소를 사용합니다.', error);
    return createMemoryStore();
  }
};

const store = createStore();

/** Supabase, TanStack Query가 함께 쓰는 문자열 저장소 어댑터 */
export const storageAdapter = {
  getItem: (key: string) => store.getString(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => {
    store.remove(key);
  },
};
