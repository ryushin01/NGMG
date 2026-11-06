import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { Alert, ScrollView } from 'react-native';
import { View, XStack, YStack } from 'tamagui';
import type { LocalPhoto, Photo } from '@/shared/api';
import { MAX_PHOTOS_PER_RECORD } from '@/shared/config';
import { AppText, Touchable } from '@/shared/ui';

type PhotoPickerProps = {
  kept: Photo[];
  added: LocalPhoto[];
  onChangeKept: (next: Photo[]) => void;
  onChangeAdded: (next: LocalPhoto[]) => void;
};

const SIZE = 88;

const toLocal = (assets: ImagePicker.ImagePickerAsset[]): LocalPhoto[] =>
  assets.map(({ uri, width, height }) => ({ uri, width, height }));

export const PhotoPicker = ({ kept, added, onChangeKept, onChangeAdded }: PhotoPickerProps) => {
  const count = kept.length + added.length;
  const remaining = MAX_PHOTOS_PER_RECORD - count;

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      orderedSelection: true,
      quality: 1,
    });
    if (result.canceled) return;
    // 같은 사진을 다시 고르면 한 번만 첨부합니다.
    const fresh = toLocal(result.assets).filter(
      (photo) => !added.some((item) => item.uri === photo.uri),
    );
    onChangeAdded([...added, ...fresh].slice(0, MAX_PHOTOS_PER_RECORD - kept.length));
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 권한을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) onChangeAdded([...added, ...toLocal(result.assets)]);
  };

  return (
    <YStack gap={8}>
      <AppText size="caption" tone="muted" bold>
        사진 ({count}/{MAX_PHOTOS_PER_RECORD})
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        <XStack gap={8}>
          {remaining > 0 ? (
            <>
              <AddTile
                testID="photo-add-library"
                label="보관함에서 추가"
                onPress={pickFromLibrary}
                icon={<ImagePlus size={24} color="#1a254f" strokeWidth={1.75} />}
              />
              <AddTile
                testID="photo-add-camera"
                label="촬영"
                onPress={takePhoto}
                icon={<Camera size={24} color="#1a254f" strokeWidth={1.75} />}
              />
            </>
          ) : null}
          {kept.map((photo, index) => (
            <Thumb
              key={photo.id}
              uri={photo.url}
              cacheKey={photo.path}
              index={index + 1}
              onRemove={() => onChangeKept(kept.filter((item) => item.id !== photo.id))}
            />
          ))}
          {added.map((photo, index) => (
            <Thumb
              key={photo.uri}
              uri={photo.uri}
              index={kept.length + index + 1}
              onRemove={() => onChangeAdded(added.filter((item) => item.uri !== photo.uri))}
            />
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
};

const AddTile = ({
  label,
  onPress,
  icon,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
  testID: string;
}) => (
  <Touchable
    testID={testID}
    onPress={onPress}
    accessibilityLabel={label}
    width={SIZE}
    height={SIZE}
    borderRadius={6}
    borderWidth={1}
    borderColor="line"
    alignItems="center"
    justifyContent="center"
    gap={4}
  >
    {icon}
    <AppText size="caption" tone="muted" fontSize={11} textAlign="center">
      {label}
    </AppText>
  </Touchable>
);

const Thumb = ({
  uri,
  cacheKey,
  index,
  onRemove,
}: {
  uri: string;
  cacheKey?: string;
  index: number;
  onRemove: () => void;
}) => (
  <View width={SIZE} height={SIZE} borderRadius={6} overflow="hidden">
    <Image
      source={{ uri, cacheKey }}
      style={{ width: SIZE, height: SIZE }}
      contentFit="cover"
      accessibilityLabel={`첨부한 사진 ${index}`}
    />
    <Touchable
      onPress={onRemove}
      accessibilityLabel={`사진 ${index} 삭제`}
      position="absolute"
      top={0}
      right={0}
      alignItems="center"
      justifyContent="center"
    >
      <View
        backgroundColor="ink"
        borderRadius={12}
        width={24}
        height={24}
        alignItems="center"
        justifyContent="center"
      >
        <X size={14} color="#ffffff" />
      </View>
    </Touchable>
  </View>
);
