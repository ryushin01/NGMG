import * as Notifications from 'expo-notifications';
import { findDestination } from '@/entities/destination';
import { storageAdapter } from '@/shared/lib';

const NOTIFIED_KEY = 'newworld.arrival.notified';
/** 경계를 오가며 같은 곳 알림이 반복되지 않도록 12시간 동안은 다시 알리지 않습니다. */
export const QUIET_MS = 12 * 60 * 60 * 1000;

const readNotified = (): Record<string, number> => {
  try {
    const value: unknown = JSON.parse(storageAdapter.getItem(NOTIFIED_KEY) ?? '{}');
    return value && typeof value === 'object' ? (value as Record<string, number>) : {};
  } catch {
    return {};
  }
};

export const arrivalMessage = (id: string) => {
  const destination = findDestination(id);
  if (!destination) return null;
  return {
    title: `${destination.name} 근처에 왔어요`,
    body:
      destination.realm === 'fantasy'
        ? '현실의 연고지에 도착했습니다. 현장 인증으로 여권에 스탬프를 찍어 보세요.'
        : '현장 인증으로 여행 여권에 스탬프를 찍어 보세요.',
    data: { url: `/destination/${destination.id}` },
  };
};

/** 지역에 들어오면 알림을 띄웁니다. 알림을 보냈으면 true입니다. */
export const notifyArrival = async (id: string, now = Date.now()) => {
  const message = arrivalMessage(id);
  if (!message) return false;
  const notified = readNotified();
  if (now - (notified[id] ?? 0) < QUIET_MS) return false;
  await Notifications.scheduleNotificationAsync({ content: message, trigger: null });
  storageAdapter.setItem(NOTIFIED_KEY, JSON.stringify({ ...notified, [id]: now }));
  return true;
};
