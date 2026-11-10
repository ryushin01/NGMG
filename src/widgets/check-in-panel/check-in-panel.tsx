import { useRouter } from 'expo-router';
import { BadgeCheck, LocateFixed } from 'lucide-react-native';
import { useState } from 'react';
import { toast } from 'sonner-native';
import { XStack, YStack } from 'tamagui';
import { useCheckins } from '@/entities/checkin';
import type { Destination } from '@/entities/destination';
import { newlyEarned, type BadgeStatus } from '@/features/badges';
import { CHECK_IN_RADIUS_KM, useCheckIn } from '@/features/check-in';
import { isSupabaseConfigured } from '@/shared/config';
import { formatDistance } from '@/shared/lib';
import { AppIcon, AppText, Button } from '@/shared/ui';
import { Celebration } from './celebration';

const dateLabel = (iso: string) => iso.slice(0, 10).replaceAll('-', '. ') + '.';

/** 여행지 상세의 현장 인증 영역. 인증하면 여권에 스탬프가 찍히고 조건을 채운 뱃지를 받습니다. */
export const CheckInPanel = ({ destination }: { destination: Destination }) => {
  const router = useRouter();
  const checkins = useCheckins();
  const checkIn = useCheckIn();
  const [pending, setPending] = useState<'gps' | 'demo' | null>(null);
  const [celebration, setCelebration] = useState<{
    checkedAt: string;
    badges: BadgeStatus[];
  } | null>(null);
  const mine = checkins.data?.find((item) => item.catalogId === destination.id);
  const fantasy = destination.realm === 'fantasy';
  const accent = fantasy ? 'fantasyText' : 'brandText';

  const run = async (demo: boolean) => {
    setPending(demo ? 'demo' : 'gps');
    const result = await checkIn(destination, { demo });
    setPending(null);
    switch (result.status) {
      case 'stamped':
        setCelebration({
          checkedAt: result.checkIn.checkedAt,
          badges: newlyEarned(result.before, result.after),
        });
        return;
      case 'far':
        toast.error(
          `${fantasy ? '연고지' : '현장'}에서 ${formatDistance(result.distance)} 떨어져 있어요. ${CHECK_IN_RADIUS_KM}km 안에서 다시 시도해 주세요.`,
        );
        return;
      case 'denied':
        toast.error('현장 인증에는 위치 권한이 필요합니다. 설정에서 위치 접근을 허용해 주세요.');
        return;
      case 'error':
        toast.error('현장 인증을 하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      default:
    }
  };

  return (
    <YStack
      testID="checkin-panel"
      marginHorizontal={20}
      marginBottom={12}
      padding={16}
      gap={12}
      borderRadius={12}
      borderWidth={1}
      borderColor={mine ? accent : 'line'}
      backgroundColor={mine ? (fantasy ? 'fantasySoft' : 'brandSoft') : 'surface'}
    >
      <XStack gap={8} alignItems="center">
        <AppIcon
          icon={mine ? BadgeCheck : LocateFixed}
          size={22}
          color={mine ? accent : 'ink'}
          strokeWidth={1.75}
        />
        <AppText size="title" accessibilityRole="header">
          현장 인증
        </AppText>
      </XStack>
      {mine ? (
        <AppText testID="checkin-done" tone="ink">
          {dateLabel(mine.checkedAt)} 인증했어요
          {mine.method === 'demo' ? ' (데모 인증)' : ''}. 여행 여권에 스탬프가 찍혔습니다.
        </AppText>
      ) : (
        <>
          <AppText>
            {fantasy ? '현실의 연고지' : '현장'} {CHECK_IN_RADIUS_KM}km 안에서 인증하면 여행 여권에
            스탬프가 찍히고, 조건을 채우면 기념 뱃지를 받아요.
          </AppText>
          <Button
            testID="checkin-gps"
            label="현재 위치로 인증하기"
            loading={pending === 'gps'}
            disabled={pending !== null}
            onPress={() => run(false)}
          />
          {isSupabaseConfigured ? null : (
            <Button
              testID="checkin-demo"
              variant="outline"
              label="데모: 현장에 있는 것으로 인증"
              loading={pending === 'demo'}
              disabled={pending !== null}
              onPress={() => run(true)}
            />
          )}
        </>
      )}
      <Celebration
        destination={destination}
        checkedAt={celebration?.checkedAt ?? null}
        badges={celebration?.badges ?? []}
        onClose={() => setCelebration(null)}
        onOpenPassport={() => {
          setCelebration(null);
          router.push('/passport');
        }}
      />
    </YStack>
  );
};
