import { Image } from 'expo-image';
import { View } from 'tamagui';
import { AppText } from '@/shared/ui';

type ProfileAvatarProps = { nickname: string; uri: string | null; size?: number };

/** 프로필 사진. 없으면 닉네임 첫 글자를 보여 줍니다. 옆에 닉네임이 함께 나오므로 장식으로 둡니다. */
export const ProfileAvatar = ({ nickname, uri, size = 64 }: ProfileAvatarProps) => (
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
      />
    ) : (
      <AppText fontSize={size * 0.42} lineHeight={`${size}px`} tone="brand" bold>
        {nickname.slice(0, 1)}
      </AppText>
    )}
  </View>
);
