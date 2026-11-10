import { forwardRef } from 'react';
import type { View as NativeView } from 'react-native';
import { View, XStack, YStack } from 'tamagui';
import { ProfileAvatar } from '@/entities/profile';
import { AppText } from '@/shared/ui';
import type { BadgeStatus } from '../model/badges';
import { BadgeMedal } from './badge-medal';

const SHOWN = 9;

/** 뱃지를 모은 사람. 닉네임은 제목에 붙이고 사진은 제목 옆에 둡니다. */
export type BadgeOwner = { nickname: string; avatarUrl: string | null };

/** owner가 있으면 '유신의 기념 뱃지'처럼 닉네임과 프로필 사진을 넣습니다. */
type BadgeCardProps = { statuses: BadgeStatus[]; dateLabel: string; owner?: BadgeOwner };

/** 공유용 뱃지 카드. 받은 뱃지를 최근 순으로 9개까지 보여 줍니다. */
export const BadgeCard = forwardRef<NativeView, BadgeCardProps>(function BadgeCard(
  { statuses, dateLabel, owner },
  ref,
) {
  const earned = statuses
    .filter((item) => item.earned)
    .sort((a, b) => (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''));
  const rest = earned.length - SHOWN;
  return (
    <View
      ref={ref as never}
      collapsable={false}
      testID="badge-card"
      width={360}
      backgroundColor="surface"
      borderRadius={16}
      padding={20}
      gap={16}
      borderWidth={1}
      borderColor="line"
    >
      <XStack gap={12} alignItems="center">
        {owner ? <ProfileAvatar nickname={owner.nickname} uri={owner.avatarUrl} size={52} /> : null}
        <YStack gap={4} flex={1}>
          <AppText size="headline" accessibilityRole="header">
            {owner ? `${owner.nickname}의 기념 뱃지` : '신세계 기념 뱃지'}
          </AppText>
          <AppText tone="muted">
            {statuses.length}개 가운데 {earned.length}개를 모았어요
          </AppText>
        </YStack>
      </XStack>
      <XStack flexWrap="wrap" justifyContent="center" gap={4}>
        {earned.slice(0, SHOWN).map((status) => (
          <BadgeMedal key={status.badge.id} status={status} size={56} />
        ))}
      </XStack>
      {rest > 0 ? (
        <AppText tone="muted" textAlign="center">
          외 {rest}개
        </AppText>
      ) : null}
      <AppText size="caption" tone="muted" textAlign="right">
        신세계 · {dateLabel}
      </AppText>
    </View>
  );
});
