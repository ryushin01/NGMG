import { styled, View } from 'tamagui';

/** 터치 영역 44pt 이상을 보장하는 눌림 요소 */
export const Touchable = styled(View, {
  name: 'Touchable',
  minHeight: 44,
  minWidth: 44,
  accessible: true,
  accessibilityRole: 'button',
  opacity: '1 press:0.6',
});
