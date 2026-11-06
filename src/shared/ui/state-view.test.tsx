import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { LoadingView, MessageView } from './state-view';

const show = (children: React.ReactNode) =>
  render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      {children}
    </TamaguiProvider>,
  );

it('로딩 상태를 접근성 이름으로 알립니다', async () => {
  await show(<LoadingView label="검색 중입니다." />);
  expect(screen.getByLabelText('검색 중입니다.')).toBeTruthy();
});

it('동작이 있을 때만 버튼을 보여 줍니다', async () => {
  const onAction = jest.fn();
  await show(<MessageView message="실패" actionLabel="다시 시도" onAction={onAction} />);
  await fireEvent.press(screen.getByLabelText('다시 시도'));
  expect(onAction).toHaveBeenCalledTimes(1);
});
