import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { notifyArrival } from './arrival';

export const ARRIVAL_TASK = 'newworld-arrival';

type GeofenceData = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

// 백그라운드에서 앱이 깨어날 때도 등록되도록 모듈을 불러오는 순간 정의합니다(루트 레이아웃에서 불러옴).
if (!TaskManager.isTaskDefined(ARRIVAL_TASK)) {
  TaskManager.defineTask<GeofenceData>(ARRIVAL_TASK, async ({ data, error }) => {
    if (error || !data) return;
    if (data.eventType !== Location.GeofencingEventType.Enter) return;
    if (data.region.identifier) await notifyArrival(data.region.identifier);
  });
}

// 앱을 쓰는 중에 들어와도 배너로 보여 줍니다.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
