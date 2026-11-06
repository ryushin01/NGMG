import type { ComponentProps } from 'react';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomCta } from './button';

/** 입력 중에도 누를 수 있도록 키보드 위에 붙는 하단 버튼 */
export const StickyBottomCta = (props: ComponentProps<typeof BottomCta>) => {
  const { bottom } = useSafeAreaInsets();
  return (
    <KeyboardStickyView offset={{ closed: 0, opened: bottom }}>
      <BottomCta {...props} />
    </KeyboardStickyView>
  );
};
