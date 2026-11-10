import dayjs from 'dayjs';
import { useRef } from 'react';
import { Modal, type View as NativeView } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { useCaptureShare } from '@/shared/lib';
import { Button } from '@/shared/ui';
import type { BadgeStatus } from '../model/badges';
import { BadgeCard } from './badge-card';

type BadgeShareContentProps = {
  statuses: BadgeStatus[];
  owner?: string;
  /** 닫기 버튼의 글자. 축하 창 안에서는 '뒤로'로 씁니다. */
  closeLabel?: string;
  onClose: () => void;
};

/** 뱃지 카드와 공유 버튼. 보이는 그대로 이미지로 찍어 공유합니다. 다른 모달 안에도 넣을 수 있습니다. */
export const BadgeShareContent = ({
  statuses,
  owner,
  closeLabel = '닫기',
  onClose,
}: BadgeShareContentProps) => {
  const card = useRef<NativeView>(null);
  const { share, sharing } = useCaptureShare();
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
            onPress={onShare}
          />
        </View>
      </XStack>
    </YStack>
  );
};

type BadgeShareProps = {
  statuses: BadgeStatus[];
  owner?: string;
  visible: boolean;
  onClose: () => void;
};

/** 뱃지 카드를 미리 보여 주는 모달. */
export const BadgeShare = ({ statuses, owner, visible, onClose }: BadgeShareProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View
      flex={1}
      backgroundColor="rgba(0,0,0,0.6)"
      alignItems="center"
      justifyContent="center"
      padding={16}
      accessibilityViewIsModal
    >
      <BadgeShareContent statuses={statuses} owner={owner} onClose={onClose} />
    </View>
  </Modal>
);
