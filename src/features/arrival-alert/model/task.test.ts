import * as TaskManager from 'expo-task-manager';
import { notifyArrival } from './arrival';
import { syncArrivalRegions } from './settings';
import { ARRIVAL_TASK } from './task';

jest.mock('expo-location', () => ({ GeofencingEventType: { Enter: 1, Exit: 2 } }));
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('expo-task-manager', () => ({
  isTaskDefined: jest.fn(() => false),
  defineTask: jest.fn(),
}));
jest.mock('./arrival', () => ({ notifyArrival: jest.fn() }));
jest.mock('./settings', () => ({ syncArrivalRegions: jest.fn() }));

const run = (body: object) => {
  const executor = jest.mocked(TaskManager.defineTask).mock.calls[0][1];
  return executor(body as never);
};

it('지역에 들어올 때만 알리고 나갈 때와 오류는 무시합니다', async () => {
  expect(TaskManager.defineTask).toHaveBeenCalledWith(ARRIVAL_TASK, expect.any(Function));
  await run({ data: { eventType: 1, region: { identifier: 'avalon' } }, error: null });
  await run({ data: { eventType: 2, region: { identifier: 'avalon' } }, error: null });
  await run({ data: null, error: { message: 'x' } });
  expect(notifyArrival).toHaveBeenCalledTimes(1);
  expect(notifyArrival).toHaveBeenCalledWith('avalon');
});

it('위치 갱신 지역을 벗어나면 새 위치에서 여행지를 다시 고릅니다', async () => {
  await run({ data: { eventType: 2, region: { identifier: 'newworld-refresh' } }, error: null });
  expect(syncArrivalRegions).toHaveBeenCalledTimes(1);
  expect(notifyArrival).toHaveBeenCalledTimes(1);
});
