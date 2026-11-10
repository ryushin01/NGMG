import { act, renderHook } from '@testing-library/react-native';
import { disableArrivalAlert, isArrivalAlertEnabled } from './settings';
import { useStopArrivalOnSignOut } from './use-stop-on-sign-out';

jest.mock('./settings', () => ({
  disableArrivalAlert: jest.fn(async () => undefined),
  isArrivalAlertEnabled: jest.fn(() => true),
}));

type Props = { id: string | null; isReady: boolean };
const render = (userId: string | null, ready = true) =>
  renderHook(({ id, isReady }: Props) => useStopArrivalOnSignOut(id, isReady), {
    initialProps: { id: userId, isReady: ready },
  });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isArrivalAlertEnabled).mockReturnValue(true);
});

it('로그인한 채로 시작하면 그대로 둡니다', async () => {
  await render('a');
  expect(disableArrivalAlert).not.toHaveBeenCalled();
});

it('세션을 읽기 전에는 아무것도 하지 않습니다', async () => {
  await render(null, false);
  expect(disableArrivalAlert).not.toHaveBeenCalled();
});

it('로그인하지 않은 상태로 시작하면 끕니다', async () => {
  await render(null);
  expect(disableArrivalAlert).toHaveBeenCalledTimes(1);
});

it('로그아웃하면 끕니다', async () => {
  const hook = await render('a');
  await act(() => hook.rerender({ id: null, isReady: true }));
  expect(disableArrivalAlert).toHaveBeenCalledTimes(1);
});

it('다른 계정으로 바뀌면 끕니다', async () => {
  const hook = await render('a');
  await act(() => hook.rerender({ id: 'b', isReady: true }));
  expect(disableArrivalAlert).toHaveBeenCalledTimes(1);
});

it('꺼져 있으면 다시 끄지 않습니다', async () => {
  jest.mocked(isArrivalAlertEnabled).mockReturnValue(false);
  await render(null);
  expect(disableArrivalAlert).not.toHaveBeenCalled();
});
