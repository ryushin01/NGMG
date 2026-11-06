import { Check, Trash2 } from 'lucide-react-native';
import { View, XStack } from 'tamagui';
import type { ChecklistItem } from '@/shared/api';
import { AppIcon, AppText, Touchable } from '@/shared/ui';

type ChecklistRowProps = {
  item: ChecklistItem;
  onToggle: () => void;
  onRemove: () => void;
};

export const ChecklistRow = ({ item, onToggle, onRemove }: ChecklistRowProps) => (
  <XStack alignItems="center" paddingLeft={20} paddingRight={8}>
    <Touchable
      testID={`checklist-item-${item.title}`}
      flex={1}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={item.title}
      accessibilityState={{ checked: item.checked }}
      paddingVertical={12}
    >
      <XStack alignItems="center" gap={12}>
        <View
          width={24}
          height={24}
          borderRadius={6}
          borderWidth={2}
          borderColor={item.checked ? 'ink' : 'muted'}
          backgroundColor={item.checked ? 'ink' : 'surface'}
          alignItems="center"
          justifyContent="center"
        >
          {item.checked ? <AppIcon icon={Check} size={16} color="surface" strokeWidth={3} /> : null}
        </View>
        <AppText
          flex={1}
          tone={item.checked ? 'muted' : 'default'}
          textDecorationLine={item.checked ? 'line-through' : 'none'}
        >
          {item.title}
        </AppText>
      </XStack>
    </Touchable>
    <Touchable
      testID={`checklist-remove-${item.title}`}
      onPress={onRemove}
      accessibilityLabel={`${item.title} 삭제`}
      alignItems="center"
      justifyContent="center"
    >
      <AppIcon icon={Trash2} size={18} color="muted" strokeWidth={1.75} />
    </Touchable>
  </XStack>
);
