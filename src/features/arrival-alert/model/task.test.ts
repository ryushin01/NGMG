import * as TaskManager from 'expo-task-manager';
import { notifyArrival } from './arrival';
import { ARRIVAL_TASK } from './task';

jest.mock('expo-location', () => ({ GeofencingEventType: { Enter: 1, Exit: 2 } }));
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('expo-task-manager', () => ({
  isTaskDefined: jest.fn(() => false),
  defineTask: jest.fn(),
}));
jest.mock('./arrival', () => ({ notifyArrival: jest.fn() }));

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
