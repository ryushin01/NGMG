import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { View, XStack, YStack } from 'tamagui';
import { computeStats, recordYears, useRecords, type RecordStats } from '@/entities/record';
import { formatPrice, toErrorMessage } from '@/shared/lib';
import { AppText, Chip, Divider, Header, LoadingView, MessageView } from '@/shared/ui';
import { MonthlyChart } from './monthly-chart';

const Stat = ({ label, value, testID }: { label: string; value: string; testID?: string }) => (
  <YStack flex={1} gap={2} accessible accessibilityLabel={`${label} ${value}`}>
    <AppText testID={testID} size="headline">
      {value}
    </AppText>
    <AppText size="caption" tone="muted">
      {label}
    </AppText>
  </YStack>
);

const Ranking = ({ title, items }: { title: string; items: RecordStats['places'] }) =>
  items.length === 0 ? null : (
    <YStack gap={8}>
      <AppText size="row" tone="ink" bold accessibilityRole="header">
        {title}
      </AppText>
      {items.map((item, index) => (
        <YStack key={item.label}>
          {index > 0 ? <Divider /> : null}
          <XStack
            paddingVertical={10}
            gap={12}
            accessible
            accessibilityLabel={`${index + 1}위 ${item.label}, ${item.count}건`}
          >
            <AppText width={20} tone="muted">
              {index + 1}
            </AppText>
            <AppText flex={1} numberOfLines={1}>
              {item.label}
            </AppText>
            <AppText bold>{item.count}건</AppText>
          </XStack>
        </YStack>
      ))}
    </YStack>
  );

export const StatsPage = () => {
  const records = useRecords();
  const years = useMemo(() => recordYears(records.data ?? []), [records.data]);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const stats = useMemo(() => computeStats(records.data ?? [], year), [records.data, year]);

  return (
    <View flex={1} backgroundColor="surface">
      <Header title="통계" />
      {records.isPending ? (
        <LoadingView />
      ) : records.isError && !records.data ? (
        <MessageView
          message={toErrorMessage(records.error)}
          actionLabel="다시 시도"
          onAction={() => records.refetch()}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 28, paddingBottom: 40 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap={8} accessibilityRole="radiogroup" accessibilityLabel="연도">
              {years.map((item) => (
                <Chip
                  key={item}
                  testID={`stats-year-${item}`}
                  label={`${item}년`}
                  selected={year === item}
                  onPress={() => setYear(item)}
                />
              ))}
            </XStack>
          </ScrollView>
          {stats.total === 0 ? (
            <MessageView message={`${year}년에는 기록이 없습니다.`} />
          ) : (
            <>
              <XStack gap={12}>
                <Stat testID="stats-fishing" label="출조" value={`${stats.fishing}회`} />
                <Stat label="맛집 방문" value={`${stats.restaurant}회`} />
                <Stat label="사진" value={`${stats.photos}장`} />
              </XStack>
              <YStack gap={12}>
                <AppText size="row" tone="ink" bold accessibilityRole="header">
                  월별 기록
                </AppText>
                <MonthlyChart monthly={stats.monthly} />
              </YStack>
              <Ranking title="자주 간 장소" items={stats.places} />
              <Ranking title="자주 쓴 미끼" items={stats.baits} />
              <Ranking title="자주 함께한 사람" items={stats.members} />
              {stats.averageRating !== null || stats.averagePrice !== null ? (
                <XStack gap={12}>
                  {stats.averageRating !== null ? (
                    <Stat label="맛집 평균 별점" value={`${stats.averageRating.toFixed(1)}점`} />
                  ) : null}
                  {stats.averagePrice !== null ? (
                    <Stat
                      label="맛집 평균 가격"
                      value={formatPrice(Math.round(stats.averagePrice))}
                    />
                  ) : null}
                </XStack>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};
