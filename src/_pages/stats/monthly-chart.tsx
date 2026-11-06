import { View, XStack, YStack } from 'tamagui';
import { AppText } from '@/shared/ui';

const HEIGHT = 120;

/** 월별 기록 수. 막대 대비를 위해 글자용 브랜드 색(4.5:1 이상)을 씁니다. */
export const MonthlyChart = ({ monthly }: { monthly: number[] }) => {
  const max = Math.max(1, ...monthly);
  const peak = monthly.indexOf(Math.max(...monthly));
  const description = monthly
    .map((count, index) => (count > 0 ? `${index + 1}월 ${count}건` : ''))
    .filter(Boolean)
    .join(', ');
  return (
    <XStack
      testID="stats-monthly"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`월별 기록 수. ${description || '기록 없음'}`}
      height={HEIGHT + 44}
      alignItems="flex-end"
      gap={2}
    >
      {monthly.map((count, index) => (
        <YStack key={index} flex={1} alignItems="center" gap={4}>
          {count > 0 && index === peak ? (
            <AppText size="caption" tone="ink" bold>
              {count}
            </AppText>
          ) : null}
          <View
            width="70%"
            height={count === 0 ? 2 : Math.max(4, (count / max) * HEIGHT)}
            backgroundColor={count === 0 ? 'line' : 'brandText'}
            borderTopLeftRadius={count === 0 ? 0 : 4}
            borderTopRightRadius={count === 0 ? 0 : 4}
          />
          <AppText size="caption" tone="muted" fontSize={11}>
            {index + 1}
          </AppText>
        </YStack>
      ))}
    </XStack>
  );
};
