import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { Modal, type View as NativeView } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { useCaptureShare } from '@/shared/lib';
import { Button } from '@/shared/ui';
import type { BadgeStatus } from '../model/badges';
import { BadgeCard, type BadgeOwner } from './badge-card';

type BadgeShareContentProps = {
  statuses: BadgeStatus[];
  owner?: BadgeOwner;
  /** 프로필을 아직 불러오는 중이면 카드가 완성될 때까지 공유를 막습니다. */
  ownerLoading?: boolean;
  /** 닫기 버튼의 글자. 축하 창 안에서는 '뒤로'로 씁니다. */
  closeLabel?: string;
  onClose: () => void;
};

/** 뱃지 카드와 공유 버튼. 보이는 그대로 이미지로 찍어 공유합니다. 다른 모달 안에도 넣을 수 있습니다. */
export const BadgeShareContent = ({
  statuses,
  owner,
  ownerLoading = false,
  closeLabel = '닫기',
  onClose,
}: BadgeShareContentProps) => {
  const card = useRef<NativeView>(null);
  const { share, sharing } = useCaptureShare();
  // 프로필 사진이 뜨기 전에 찍으면 사진이 빠지므로 준비될 때까지 공유를 막습니다.
  // 사진 주소가 바뀌면 새 사진을 기다리도록, 준비된 주소를 기억해 지금 주소와 비교합니다.
  const avatarUrl = owner?.avatarUrl ?? null;
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const markReady = useCallback(() => setReadyUrl(avatarUrl), [avatarUrl]);
  const avatarReady = !ownerLoading && (!avatarUrl || readyUrl === avatarUrl);
  const onShare = async () => {
    if (!(await share(card, { dialogTitle: '기념 뱃지 공유' }))) {
      toast.error('뱃지 이미지를 만들지 못했습니다.');
    }
  };
  return (
    <YStack gap={16} alignItems="center">
      <BadgeCard
        ref={card}
        statuses={statuses}
        owner={owner}
        onAvatarReady={markReady}
        dateLabel={dayjs().format('YYYY. M. D.')}
      />
      <XStack gap={8} width={360} maxWidth="100%">
        <View flex={1}>
          <Button
            testID="badge-share-close"
            variant="outline"
            label={closeLabel}
            onPress={onClose}
          />
        </View>
        <View flex={1}>
          <Button
            testID="badge-share-confirm"
            label="이미지 공유"
            loading={sharing}
            disabled={!avatarReady}
            onPress={onShare}
          />
        </View>
      </XStack>
    </YStack>
  );
};

type BadgeShareProps = {
  statuses: BadgeStatus[];
  owner?: BadgeOwner;
  ownerLoading?: boolean;
  visible: boolean;
  onClose: () => void;
};

/** 뱃지 카드를 미리 보여 주는 모달. */
export const BadgeShare = ({
  statuses,
  owner,
  ownerLoading,
  visible,
  onClose,
}: BadgeShareProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View
      flex={1}
      backgroundColor="rgba(0,0,0,0.6)"
      alignItems="center"
      justifyContent="center"
      padding={16}
      accessibilityViewIsModal
    >
      <BadgeShareContent
        statuses={statuses}
        owner={owner}
        ownerLoading={ownerLoading}
        onClose={onClose}
      />
    </View>
  </Modal>
);
