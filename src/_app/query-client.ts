import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { sync } from '@/shared/api';
import { storageAdapter } from '@/shared/lib';

const DAY = 24 * 60 * 60 * 1000;
const RETRY_INTERVAL = 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    // 조회 함수가 끊긴 상태를 직접 처리해 마지막 값을 돌려주므로 멈추지 않게 합니다.
    queries: { staleTime: 30 * 1000, gcTime: 7 * DAY, retry: 2, networkMode: 'always' },
    mutations: { networkMode: 'always' },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: storageAdapter,
  key: 'newworld.query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: 7 * DAY,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string }; meta?: Record<string, unknown> }) =>
      query.state.status === 'success' && query.meta?.persist !== false,
  },
};

/** 앱이 앞으로 나오거나 네트워크가 돌아오면 서버와 다시 동기화합니다. */
export const connectQueryManagers = () => {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false;
      setOnline(online);
      sync.setOnline(online);
    }),
  );
  const onAppState = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
    if (status === 'active') void sync.flush({ force: true });
  };
  const subscription = AppState.addEventListener('change', onAppState);
  // 일시적인 서버 오류나 잘못된 연결 상태 보고로 멈춘 전송을 다시 시도합니다.
  const timer = setInterval(() => void sync.flush({ force: true }), RETRY_INTERVAL);
  const unsubscribeSynced = sync.onSynced(() => void queryClient.invalidateQueries());
  return () => {
    subscription.remove();
    clearInterval(timer);
    unsubscribeSynced();
  };
};
