import { BadgeCheck } from 'lucide-react-native';
import { Modal, ScrollView } from 'react-native';
import { View, XStack, YStack } from 'tamagui';
import type { Destination } from '@/entities/destination';
import { BadgeMedal, type BadgeStatus } from '@/features/badges';
import { formatDay } from '@/shared/lib';
import { AppIcon, AppText, Button } from '@/shared/ui';

type CelebrationProps = {
  destination: Destination;
  checkedAt: string | null;
  badges: BadgeStatus[];
  onClose: () => void;
  onOpenPassport: () => void;
};

/** 스탬프를 찍은 직후 보여 주는 축하 화면. 이번에 새로 받은 뱃지가 있으면 함께 보여 줍니다. */
export const Celebration = ({
  destination,
  checkedAt,
  badges,
  onClose,
  onOpenPassport,
}: CelebrationProps) => {
  const accent = destination.realm === 'real' ? 'brandText' : 'fantasyText';
  return (
    <Modal visible={checkedAt !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View
        flex={1}
        backgroundColor="rgba(0,0,0,0.6)"
        alignItems="center"
        justifyContent="center"
        padding={16}
        accessibilityViewIsModal
      >
        <YStack
          testID="checkin-celebration"
          width={360}
          maxWidth="100%"
          maxHeight="90%"
          backgroundColor="surface"
          borderRadius={20}
          padding={24}
          gap={20}
        >
          <ScrollView contentContainerStyle={{ gap: 20, alignItems: 'center' }}>
            <YStack alignItems="center" gap={10}>
              <View
                width={88}
                height={88}
                borderRadius={44}
                borderWidth={4}
                borderColor={accent}
                alignItems="center"
                justifyContent="center"
              >
                <AppIcon icon={BadgeCheck} size={48} color={accent} strokeWidth={1.75} />
              </View>
              <AppText size="headline" textAlign="center" accessibilityRole="header">
                스탬프를 찍었어요
              </AppText>
              <AppText textAlign="center">
                {destination.name}
                {destination.realm === 'fantasy' ? '의 현실 연고지' : ''}에 다녀왔음을 인증했습니다.
              </AppText>
              {checkedAt ? (
                <AppText size="caption" tone="muted">
                  {formatDay(checkedAt)} 여행 여권에 기록됨
                </AppText>
              ) : null}
            </YStack>
            {badges.length > 0 ? (
              <YStack gap={12} alignItems="center" testID="checkin-new-badges">
                <AppText size="title">새 기념 뱃지 {badges.length}개</AppText>
                <XStack flexWrap="wrap" justifyContent="center" gap={8}>
                  {badges.map((status) => (
                    <BadgeMedal key={status.badge.id} status={status} />
                  ))}
                </XStack>
              </YStack>
            ) : null}
          </ScrollView>
          <XStack gap={8}>
            <View flex={1}>
              <Button testID="checkin-close" variant="outline" label="닫기" onPress={onClose} />
            </View>
            <View flex={1}>
              <Button testID="checkin-passport" label="여권 보기" onPress={onOpenPassport} />
            </View>
          </XStack>
        </YStack>
      </View>
    </Modal>
  );
};
