import { useState } from 'react';
import { Image } from 'react-native';
import { Marker, type LatLng } from 'react-native-maps';
import { KIND_META } from '@/entities/place';
import type { PlaceKind } from '@/shared/api';

type PlaceMarkerProps = {
  coordinate: LatLng;
  kind: PlaceKind;
  label?: string;
  /** 현장 인증한 곳이면 체크가 붙은 핀을 씁니다. */
  verified?: boolean;
  testID?: string;
  onPress?: () => void;
};

/** 이미지가 로드된 뒤 뷰 추적을 꺼서 지도 성능을 유지합니다. */
export const PlaceMarker = ({
  coordinate,
  kind,
  label,
  verified = false,
  testID,
  onPress,
}: PlaceMarkerProps) => {
  const source = verified ? KIND_META[kind].verifiedPin : KIND_META[kind].pin;
  // 인증으로 핀 이미지가 바뀌면 새 이미지를 불러올 때까지 다시 추적해 지도에 반영합니다.
  const [loadedSource, setLoadedSource] = useState<number | null>(null);
  return (
    <Marker
      testID={testID}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={loadedSource !== source}
      accessibilityLabel={label}
      onPress={onPress}
    >
      <Image
        testID={testID ? `${testID}-image` : undefined}
        source={source}
        style={{ width: 40, height: 50 }}
        fadeDuration={0}
        onLoad={() => setLoadedSource(source)}
      />
    </Marker>
  );
};
