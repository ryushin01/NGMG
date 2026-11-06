import { View } from 'tamagui';
import type { PlaceKind } from '@/shared/api';
import { AppText } from '@/shared/ui';
import { KIND_META } from '../model/kind';

export const KindBadge = ({ kind }: { kind: PlaceKind }) => {
  const meta = KIND_META[kind];
  return (
    <View
      backgroundColor={meta.background as never}
      paddingHorizontal={8}
      paddingVertical={2}
      borderRadius={4}
      alignSelf="flex-start"
    >
      <AppText size="caption" bold color={meta.text as never}>
        {meta.label}
      </AppText>
    </View>
  );
};
