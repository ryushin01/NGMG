import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useCheckins } from '@/entities/checkin';
import { syncArrivalRegions } from './settings';

/** 인증 목록이 바뀌거나 앱으로 돌아오면 지켜볼 지역을 다시 고릅니다. 로그인한 화면에서만 씁니다. */
export const useArrivalSync = () => {
  const checkins = useCheckins();
  const checkedIds = useMemo(
    () => new Set((checkins.data ?? []).map((item) => item.catalogId)),
    [checkins.data],
  );
  const ready = checkins.isSuccess;

  useEffect(() => {
    if (!ready) return;
    syncArrivalRegions(checkedIds).catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncArrivalRegions(checkedIds).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [checkedIds, ready]);

  return checkedIds;
};
