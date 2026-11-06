import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'tamagui';
import type { Photo } from '@/shared/api';
import { AppText, Touchable } from '@/shared/ui';

const ZoomableImage = ({
  photo,
  width,
  height,
  label,
}: {
  photo: Photo;
  width: number;
  height: number;
  label: string;
}) => {
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(saved.value * event.scale, 4));
    })
    .onEnd(() => {
      saved.value = scale.value;
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > 1 ? 1 : 2.5;
      scale.value = withTiming(next);
      saved.value = next;
    });
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, doubleTap)}>
      <Animated.View style={[{ width, height }, animated]}>
        <Image
          source={{ uri: photo.url, cacheKey: photo.path }}
          style={{ width, height }}
          contentFit="contain"
          accessibilityLabel={label}
        />
      </Animated.View>
    </GestureDetector>
  );
};

/** 가로로 넘겨 보는 사진 목록과 확대 가능한 전체 화면 보기 */
export const PhotoGallery = ({ photos, label }: { photos: Photo[]; label: string }) => {
  const { width, height } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const pageHeight = Math.round(width * 0.72);

  return (
    <View>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(photo) => photo.id}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index }) => (
          <Touchable
            testID={`photo-${index}`}
            onPress={() => setViewerIndex(index)}
            accessibilityLabel={`${label} 사진 ${index + 1}, 크게 보기`}
            opacity="1 press:0.9"
          >
            <Image
              source={{ uri: item.url, cacheKey: item.path }}
              style={{ width, height: pageHeight }}
              contentFit="cover"
              transition={150}
            />
          </Touchable>
        )}
      />
      <View
        position="absolute"
        right={12}
        bottom={12}
        backgroundColor="ink"
        paddingHorizontal={10}
        borderRadius={12}
      >
        <AppText tone="inverse" size="caption" accessibilityLiveRegion="polite">
          {page + 1} / {photos.length}
        </AppText>
      </View>
      <Modal
        visible={viewerIndex !== null}
        animationType="fade"
        onRequestClose={() => setViewerIndex(null)}
        presentationStyle="fullScreen"
      >
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex ?? 0}
            getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(photo) => photo.id}
            renderItem={({ item, index }) => (
              <ZoomableImage
                photo={item}
                width={width}
                height={height}
                label={`${label} 사진 ${index + 1}`}
              />
            )}
          />
          <Touchable
            testID="photo-viewer-close"
            position="absolute"
            top={top + 8}
            right={8}
            onPress={() => setViewerIndex(null)}
            accessibilityLabel="사진 보기 닫기"
            alignItems="center"
            justifyContent="center"
          >
            <X color="#ffffff" size={26} />
          </Touchable>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};
