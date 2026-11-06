import { useEffect } from 'react';
import { create } from 'zustand';
import { backend, type Session } from '@/shared/api';

type SessionState = {
  session: Session | null;
  ready: boolean;
  set: (session: Session | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  ready: false,
  set: (session) => set({ session, ready: true }),
}));

/** 앱 시작 시 저장된 세션을 읽고 이후 변경을 구독합니다. */
export const useSessionBootstrap = () => {
  const setSession = useSessionStore((state) => state.set);
  useEffect(() => {
    // 토큰 갱신이 끝나기를 기다리면 오프라인에서 시작 화면에 오래 묶입니다.
    const cached = backend.auth.getCachedSession();
    if (cached) setSession(cached);
    backend.auth.getSession().then(setSession, () => {
      if (!cached) setSession(null);
    });
    return backend.auth.subscribe(setSession);
  }, [setSession]);
};
