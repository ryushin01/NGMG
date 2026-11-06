import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { Button } from './button';
import { Chip } from './chip';
import { Field } from './field';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));

const wrap = (children: ReactNode) => (
  <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
    {children}
  </TamaguiProvider>
);

describe('Button', () => {
  it('누르면 호출되고 레이블을 접근성 이름으로 제공합니다', async () => {
    const onPress = jest.fn();
    await render(wrap(<Button label="저장" onPress={onPress} />));
    await fireEvent.press(screen.getByLabelText('저장'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('저장 중에는 눌림 처리기를 제거해 중복 호출을 막습니다', async () => {
    await render(wrap(<Button label="저장" loading onPress={jest.fn()} />));
    const button = screen.getByLabelText('저장');
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    expect(button.props.onClick ?? button.props.onPress).toBeUndefined();
  });
});

it('Chip은 선택 상태를 접근성 상태로 알립니다', async () => {
  await render(wrap(<Chip label="맛집" selected />));
  expect(screen.getByLabelText('맛집').props.accessibilityState).toMatchObject({ selected: true });
});

it('Field는 레이블과 오류를 보여 줍니다', async () => {
  await render(
    wrap(
      <Field
        label="이름"
        required
        error="이름을 입력해 주세요."
        value=""
        onChangeText={() => undefined}
      />,
    ),
  );
  expect(screen.getByLabelText('이름, 필수')).toBeTruthy();
  expect(screen.getByText('이름을 입력해 주세요.')).toBeTruthy();
});
