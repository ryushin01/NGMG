import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { ChecklistRow } from './checklist-row';

const item = {
  id: '1',
  title: '구명조끼',
  category: '안전',
  checked: true,
  position: 0,
  listName: '기본',
};

it('체크 상태를 전달하고 체크와 삭제를 나눠 처리합니다', async () => {
  const onToggle = jest.fn();
  const onRemove = jest.fn();
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ChecklistRow item={item} onToggle={onToggle} onRemove={onRemove} />
    </TamaguiProvider>,
  );
  const box = screen.getByRole('checkbox', { name: '구명조끼' });
  expect(box.props.accessibilityState).toEqual({ checked: true });
  await fireEvent.press(box);
  expect(onToggle).toHaveBeenCalledTimes(1);
  expect(onRemove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('구명조끼 삭제'));
  expect(onRemove).toHaveBeenCalledTimes(1);
});
