import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { useSessionBootstrap, useSessionStore } from '@/entities/session';
import { backend } from '@/shared/api';
import { useAppFonts, useColors } from '@/shared/ui';
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
const useRecoveryLink = (navigatorReady: boolean) => {
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
  // 세션과 글꼴을 불러오는 동안에는 Stack이 없으므로 준비될 때까지 이동을 미룹니다.
  useEffect(() => {
    if (!navigatorReady || !signedIn || requested === handled.current) return;
    handled.current = requested;
    router.push('/reset-password');
  }, [navigatorReady, requested, router, signedIn]);
};

const Navigator = () => {
  const colors = useColors();
  useSessionBootstrap();
  useClearCacheOnSignOut();
  const session = useSessionStore((state) => state.session);
  const sessionReady = useSessionStore((state) => state.ready);
  const fontsReady = useAppFonts();
  const ready = sessionReady && fontsReady;
  useRecoveryLink(ready);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="destination/[id]" />
          <Stack.Screen name="courses" />
          <Stack.Screen name="timeline" />
          <Stack.Screen name="passport" />
          <Stack.Screen name="trips" />
          <Stack.Screen name="trip/new" />
          <Stack.Screen name="trip/[id]/index" />
          <Stack.Screen name="trip/[id]/edit" />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="map-pick" />
          <Stack.Screen name="place/new" />
          <Stack.Screen name="place/[id]/index" />
          <Stack.Screen name="place/[id]/edit" />
          <Stack.Screen name="places" />
          <Stack.Screen name="record/new" />
          <Stack.Screen name="record/[id]/index" />
          <Stack.Screen name="record/[id]/edit" />
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
