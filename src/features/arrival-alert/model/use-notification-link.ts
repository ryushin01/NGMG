import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

const urlOf = (response: Notifications.NotificationResponse | null) => {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
    return null;
  const url = response.notification.request.content.data?.url;
  // 앱이 만든 여행지 주소만 엽니다.
  return typeof url === 'string' && /^\/destination\/[\w-]+$/.test(url) ? url : null;
};

/** 도착 알림을 누르면 그 여행지 화면을 엽니다. 꺼진 앱이 알림으로 열린 경우도 처리합니다. */
export const useNotificationLink = (navigatorReady: boolean) => {
  const router = useRouter();
  // 세션과 글꼴을 불러오는 동안에는 Stack이 없으므로 준비될 때까지 주소를 맡아 둡니다.
  const ready = useRef(navigatorReady);
  const pending = useRef<string | null>(null);

  useEffect(() => {
    const open = (url: string) => {
      if (ready.current) router.push(url as never);
      else pending.current = url;
    };
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        const url = urlOf(response);
        if (url) open(url);
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = urlOf(response);
      if (url) open(url);
    });
    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    ready.current = navigatorReady;
    if (navigatorReady && pending.current) {
      const url = pending.current;
      pending.current = null;
      router.push(url as never);
    }
  }, [navigatorReady, router]);
};
