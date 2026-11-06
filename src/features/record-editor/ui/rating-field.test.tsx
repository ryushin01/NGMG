import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { RatingField } from './rating-field';

it('점수를 고르고 같은 점수를 다시 누르면 지웁니다', async () => {
  const onChange = jest.fn();
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <RatingField value={3} onChange={onChange} />
    </TamaguiProvider>,
  );
  await fireEvent.press(screen.getByLabelText('4점'));
  expect(onChange).toHaveBeenLastCalledWith(4);
  await fireEvent.press(screen.getByLabelText('3점'));
  expect(onChange).toHaveBeenLastCalledWith(null);
});
