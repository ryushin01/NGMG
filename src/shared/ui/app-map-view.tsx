import Constants from 'expo-constants';
import { forwardRef, type ComponentProps } from 'react';
import { Platform } from 'react-native';
import MapView from 'react-native-maps';
import { View } from 'tamagui';
import { AppText } from './typography';

const isMapAvailable =
  Platform.OS !== 'android' || Constants.expoConfig?.extra?.googleMapsConfigured === true;

/** Android는 Google 지도 키가 없으면 앱이 종료되므로 지도 대신 안내를 보여 줍니다. */
export const AppMapView = forwardRef<MapView, ComponentProps<typeof MapView>>(function AppMapView(
  { children, ...props },
  ref,
) {
  if (!isMapAvailable) {
    return (
      <View
        style={props.style as never}
        backgroundColor="brandSoft"
        alignItems="center"
        justifyContent="center"
        padding={24}
      >
        <AppText tone="muted" textAlign="center" testID="map-unavailable">
          지도 키가 설정되지 않아 지도를 표시할 수 없습니다.
        </AppText>
      </View>
    );
  }
  return (
    <MapView ref={ref} {...props}>
      {children}
    </MapView>
  );
});
