import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { enableArrivalAlert } from '../model/settings';
import { ArrivalAlertSwitch } from './arrival-alert-switch';

jest.mock('sonner-native', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../model/settings', () => ({
  isArrivalAlertEnabled: () => false,
  enableArrivalAlert: jest.fn(),
  disableArrivalAlert: jest.fn(),
}));

const control = () => screen.getByRole('switch', { name: '근처 여행지 도착 알림' });

/** 설명 창이 뜨면 answer 버튼을 바로 누릅니다. */
const answerWith = (answer: '계속' | '취소') =>
  jest.spyOn(Alert, 'alert').mockImplementation((title, _message, buttons?: AlertButton[]) => {
    if (title === '근처 여행지 도착 알림')
      buttons?.find((button) => button.text === answer)?.onPress?.();
  });

const show = () =>
  render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ArrivalAlertSwitch checkedIds={new Set()} />
    </TamaguiProvider>,
  );

beforeEach(() => jest.mocked(enableArrivalAlert).mockReset());

it('이유를 먼저 설명하고, 계속을 누르면 권한을 받아 켭니다', async () => {
  const alert = answerWith('계속');
  jest.mocked(enableArrivalAlert).mockResolvedValue('enabled');
  await show();
  await fireEvent.press(control());
  expect(alert).toHaveBeenCalledWith(
    '근처 여행지 도착 알림',
    expect.stringContaining('항상 허용'),
    expect.any(Array),
    expect.any(Object),
  );
  expect(enableArrivalAlert).toHaveBeenCalledTimes(1);
  expect(control().props.accessibilityState).toMatchObject({ checked: true });
});

it('취소하면 권한을 요청하지 않고 꺼진 채로 둡니다', async () => {
  answerWith('취소');
  await show();
  await fireEvent.press(control());
  expect(enableArrivalAlert).not.toHaveBeenCalled();
  expect(control().props.accessibilityState).toMatchObject({ checked: false });
});

it("'항상' 권한을 받지 못하면 이유와 설정 바로가기를 보여 줍니다", async () => {
  const alert = answerWith('계속');
  jest.mocked(enableArrivalAlert).mockResolvedValue('background-denied');
  await show();
  await fireEvent.press(control());
  expect(alert).toHaveBeenLastCalledWith(
    '알림을 켜지 못했습니다',
    expect.stringContaining('항상 허용'),
    expect.arrayContaining([expect.objectContaining({ text: '설정 열기' })]),
  );
  expect(control().props.accessibilityState).toMatchObject({ checked: false });
});
