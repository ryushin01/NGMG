import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useSessionBootstrap, useSessionStore } from '@/entities/session';
// 백그라운드 도착 작업은 앱이 깨어날 때 가장 먼저 정의되어야 하므로 루트에서 불러옵니다.
import { useNotificationLink } from '@/features/arrival-alert';
import { RecoveryCodeModal } from '@/features/auth';
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

const Navigator = () => {
  const colors = useColors();
  useSessionBootstrap();
  useClearCacheOnSignOut();
  const session = useSessionStore((state) => state.session);
  const sessionReady = useSessionStore((state) => state.ready);
  const fontsReady = useAppFonts();
  const ready = sessionReady && fontsReady;
  useNotificationLink(ready && !!session);

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
          <Stack.Screen name="profile-edit" />
          <Stack.Screen name="password" />
          <Stack.Screen name="recovery-code" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="recover" />
        </Stack.Protected>
      </Stack>
      {/* 가입·복구·다시 발급 직후 한 번만 복구 코드를 보여 줍니다. */}
      <RecoveryCodeModal />
    </>
  );
};

export const RootLayout = () => (
  <Providers>
    <Navigator />
  </Providers>
);
