import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const untilMidnight = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 1000;
};

/**
 * 오늘 날짜(기기 시간대). 화면을 켠 채 자정이 지나거나, 다음 날 앱으로 돌아오면 새 날짜를 돌려줍니다.
 * 같은 날에는 같은 Date 객체를 유지해 useMemo가 다시 계산하지 않습니다.
 */
export const useToday = () => {
  const [today, setToday] = useState(() => new Date());
  const key = dayKey(today);

  useEffect(() => {
    const refresh = () => {
      const now = new Date();
      if (dayKey(now) !== key) setToday(now);
    };
    const timer = setTimeout(refresh, untilMidnight());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [key]);

  return today;
};
