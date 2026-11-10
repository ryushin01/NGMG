import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import type { z } from 'zod';
import { ProfileAvatar, useProfile, useUpdateProfile } from '@/entities/profile';
import { FormField, profileSchema } from '@/features/auth';
import type { LocalPhoto } from '@/shared/api';
import { toErrorMessage, useSubmitLock } from '@/shared/lib';
import { Button, Header, LoadingView, MessageView, useColors } from '@/shared/ui';

type ProfileForm = z.infer<typeof profileSchema>;

const ProfileEditForm = ({
  initial,
}: {
  initial: { nickname: string; name: string; avatarUrl: string | null };
}) => {
  const router = useRouter();
  const colors = useColors();
  const update = useUpdateProfile();
  // 성공하면 화면을 떠나므로 실패할 때만 잠금을 풉니다.
  const lock = useSubmitLock();
  /** undefined: 그대로, null: 지움, LocalPhoto: 새 사진 */
  const [avatar, setAvatar] = useState<LocalPhoto | null | undefined>(undefined);
  const { control, handleSubmit } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nickname: initial.nickname, name: initial.name },
  });
  const typedNickname = useWatch({ control, name: 'nickname' });
  const preview = avatar === undefined ? initial.avatarUrl : (avatar?.uri ?? null);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return;
    const [asset] = result.assets;
    setAvatar({ uri: asset.uri, width: asset.width, height: asset.height });
  };

  const submit = handleSubmit((data) => {
    if (!lock.take()) return;
    update.mutate(
      { ...data, avatar },
      {
        onSuccess: () => {
          toast.success('프로필을 저장했습니다.');
          router.back();
        },
        onError: (error) => {
          lock.release();
          toast.error(toErrorMessage(error, '프로필을 저장하지 못했습니다.'));
        },
      },
    );
  });

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 24, gap: 24 }}
    >
      <YStack alignItems="center" gap={12}>
        <ProfileAvatar nickname={typedNickname || initial.nickname} uri={preview} size={112} />
        {/* 버튼이 글자 폭으로 줄어들지 않도록 가로를 나눠 채웁니다. */}
        <XStack gap={8} alignSelf="stretch">
          <View flex={1}>
            <Button testID="avatar-pick" variant="outline" label="사진 고르기" onPress={pick} />
          </View>
          {preview ? (
            <View flex={1}>
              <Button
                testID="avatar-remove"
                variant="outline"
                label="사진 지우기"
                onPress={() => setAvatar(null)}
              />
            </View>
          ) : null}
        </XStack>
      </YStack>
      <FormField
        control={control}
        name="nickname"
        label="닉네임"
        kind="nickname"
        hint="여권과 공유 이미지에 보이는 이름입니다. 2~20자"
      />
      <FormField
        control={control}
        name="name"
        label="이름"
        kind="name"
        required={false}
        hint="본인만 볼 수 있습니다."
        onSubmit={submit}
      />
      <Button testID="profile-save" label="저장" loading={update.isPending} onPress={submit} />
    </KeyboardAwareScrollView>
  );
};

export const ProfileEditPage = () => {
  const profile = useProfile();
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="프로필 편집" />
      {profile.data ? (
        <ProfileEditForm initial={profile.data} />
      ) : profile.isError ? (
        <MessageView
          message={toErrorMessage(profile.error, '프로필을 불러오지 못했습니다.')}
          actionLabel="다시 시도"
          onAction={() => profile.refetch()}
        />
      ) : (
        <LoadingView />
      )}
    </View>
  );
};
