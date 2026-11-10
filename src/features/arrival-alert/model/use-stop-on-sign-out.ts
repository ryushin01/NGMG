import { useEffect, useRef } from 'react';
import { disableArrivalAlert, isArrivalAlertEnabled } from './settings';

/**
 * 도착 알림은 기기에 켜 두는 백그라운드 위치 감시라, 로그아웃·계정 삭제·계정 전환 뒤에도 계속 돌면
 * 이전 사람의 인증 목록으로 위치를 지켜보고 알림을 보냅니다. 세션이 없어지거나 바뀌면 끕니다.
 * 다음 사람은 MY 탭에서 직접 다시 켭니다.
 */
export const useStopArrivalOnSignOut = (userId: string | null, ready: boolean) => {
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const changed = previous.current !== null && previous.current !== userId;
    previous.current = userId;
    if ((userId === null || changed) && isArrivalAlertEnabled()) {
      disableArrivalAlert().catch(() => undefined);
    }
  }, [ready, userId]);
};
