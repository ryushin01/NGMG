import * as Crypto from 'expo-crypto';
import { useSyncExternalStore } from 'react';
import { isSupabaseConfigured } from '../config';
import { photoStore } from '../lib/photo';
import { storageAdapter } from '../lib/storage';
import { demoBackend } from './demo-backend';
import { createOfflineBackend } from './offline-backend';
import type { Backend } from './types';

export * from './types';
export { fetchConditions, type Conditions } from './conditions';
export { isDemoOffline, setDemoOffline } from './demo-backend';
export type { OutboxOp, SyncState } from './offline-backend';

const base: Backend = isSupabaseConfigured
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./supabase-backend') as typeof import('./supabase-backend')).supabaseBackend
  : demoBackend;

export const { backend, sync } = createOfflineBackend(base, {
  storage: storageAdapter,
  photos: photoStore,
  newId: () => Crypto.randomUUID(),
});

export const useSyncState = () => useSyncExternalStore(sync.subscribe, sync.getState);

/** 서버까지 올라갔는지에 따라 저장 완료 문구를 나눕니다. */
export const savedMessage = (subject: string) =>
  sync.getState().ops.some((op) => op.status === 'pending')
    ? `${subject}을(를) 기기에 저장했습니다. 연결되면 자동으로 올립니다.`
    : `${subject}을(를) 저장했습니다.`;
