import { Star } from 'lucide-react-native';
import { XStack, YStack } from 'tamagui';
import { AppText, Touchable } from '@/shared/ui';

type RatingFieldProps = { value: number | null; onChange: (next: number | null) => void };

export const RatingField = ({ value, onChange }: RatingFieldProps) => (
  <YStack gap={8}>
    <AppText size="caption" tone="muted" bold>
      별점 {value ? `${value}점` : '없음'}
    </AppText>
    <XStack accessibilityRole="radiogroup">
      {[1, 2, 3, 4, 5].map((score) => (
        <Touchable
          key={score}
          testID={`rating-${score}`}
          accessibilityRole="radio"
          accessibilityLabel={`${score}점`}
          accessibilityState={{ checked: value === score, selected: value === score }}
          onPress={() => onChange(value === score ? null : score)}
          alignItems="center"
          justifyContent="center"
        >
          <Star
            size={28}
            strokeWidth={1.5}
            color="#1a254f"
            fill={value && score <= value ? '#00a8ff' : 'transparent'}
          />
        </Touchable>
      ))}
    </XStack>
  </YStack>
);
