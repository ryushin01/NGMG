import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { useSessionBootstrap, useSessionStore } from '@/entities/session';
import { backend } from '@/shared/api';
import { Providers } from './providers';

SplashScreen.preventAutoHideAsync();

/** 다른 계정의 데이터가 남지 않도록 로그아웃하면 캐시를 비웁니다. */
const useClearCacheOnSignOut = () => {
  const client = useQueryClient();
  const userId = useSessionStore((state) => state.session?.userId);
  const previous = useRef(userId);
  useEffect(() => {
    if (previous.current && previous.current !== userId) client.clear();
    previous.current = userId;
  }, [client, userId]);
};

/** 비밀번호 재설정 메일의 링크로 앱이 열리면 새 비밀번호 화면으로 보냅니다. */
const useRecoveryLink = () => {
  const router = useRouter();
  const url = Linking.useLinkingURL();
  const signedIn = useSessionStore((state) => !!state.session);
  const [requested, setRequested] = useState(0);
  const handled = useRef(0);
  useEffect(() => {
    if (!url) return;
    backend.auth.applyRecoveryLink(url).then(
      (applied) => {
        if (applied) setRequested((count) => count + 1);
      },
      () => undefined,
    );
  }, [url]);
  // 렌더가 끝난 뒤에 이동해야 로그인 화면이 홈으로 바뀌면서 새 화면을 지우지 않습니다.
  useEffect(() => {
    if (!signedIn || requested === handled.current) return;
    handled.current = requested;
    router.push('/reset-password');
  }, [requested, router, signedIn]);
};

const Navigator = () => {
  useSessionBootstrap();
  useClearCacheOnSignOut();
  useRecoveryLink();
  const session = useSessionStore((state) => state.session);
  const ready = useSessionStore((state) => state.ready);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="map-pick" />
          <Stack.Screen name="place/new" />
          <Stack.Screen name="place/[id]/index" />
          <Stack.Screen name="place/[id]/edit" />
          <Stack.Screen name="places" />
          <Stack.Screen name="records" />
          <Stack.Screen name="record/new" />
          <Stack.Screen name="record/[id]/index" />
          <Stack.Screen name="record/[id]/edit" />
          <Stack.Screen name="account" />
          <Stack.Screen name="checklist" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="sync" />
        </Stack.Protected>
        <Stack.Screen name="reset-password" />
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
      </Stack>
    </>
  );
};

export const RootLayout = () => (
  <Providers>
    <Navigator />
  </Providers>
);
