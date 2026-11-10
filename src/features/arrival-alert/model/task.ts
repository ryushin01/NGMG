import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { notifyArrival } from './arrival';
import { ARRIVAL_TASK, REFRESH_REGION_ID } from './regions';
import { isArrivalAlertEnabled, stopRegions, syncArrivalRegions } from './settings';

export { ARRIVAL_TASK };

type GeofenceData = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

// 백그라운드에서 앱이 깨어날 때도 등록되도록 모듈을 불러오는 순간 정의합니다(루트 레이아웃에서 불러옴).
if (!TaskManager.isTaskDefined(ARRIVAL_TASK)) {
  TaskManager.defineTask<GeofenceData>(ARRIVAL_TASK, async ({ data, error }) => {
    if (error || !data?.region.identifier) return;
    // 꺼진 뒤에 남은 지역(멈추기 실패, 꺼지는 중에 등록된 경우)은 알리지 않고 멈춥니다.
    if (!isArrivalAlertEnabled()) {
      await stopRegions().catch(() => undefined);
      return;
    }
    const { eventType, region } = data;
    if (region.identifier === REFRESH_REGION_ID) {
      // 멀리 이동했으므로 새 위치에서 가까운 여행지로 다시 고릅니다.
      if (eventType === Location.GeofencingEventType.Exit) await syncArrivalRegions();
      return;
    }
    if (eventType === Location.GeofencingEventType.Enter) await notifyArrival(region.identifier!);
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
