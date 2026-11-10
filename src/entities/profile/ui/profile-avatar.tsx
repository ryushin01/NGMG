import { useEffect } from 'react';
import { Image } from 'expo-image';
import { View } from 'tamagui';
import { AppText } from '@/shared/ui';

type ProfileAvatarProps = {
  nickname: string;
  uri: string | null;
  size?: number;
  /** 사진을 불러왔거나(실패 포함) 사진이 없을 때 부릅니다. 이미지로 찍기 전에 기다릴 때 씁니다. */
  onReady?: () => void;
};

/** 프로필 사진. 없으면 닉네임 첫 글자를 보여 줍니다. 옆에 닉네임이 함께 나오므로 장식으로 둡니다. */
export const ProfileAvatar = ({ nickname, uri, size = 64, onReady }: ProfileAvatarProps) => {
  useEffect(() => {
    if (!uri) onReady?.();
  }, [uri, onReady]);
  return (
    <View
      testID="profile-avatar"
      width={size}
      height={size}
      borderRadius={size / 2}
      overflow="hidden"
      backgroundColor="brandSoft"
      alignItems="center"
      justifyContent="center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {uri ? (
        <Image
          testID="profile-avatar-image"
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
          onLoad={onReady}
          onError={onReady}
        />
      ) : (
        <AppText fontSize={size * 0.42} lineHeight={`${size}px`} tone="brand" bold>
          {nickname.slice(0, 1)}
        </AppText>
      )}
    </View>
  );
};
