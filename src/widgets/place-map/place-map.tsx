import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, type LatLng, type MapType, type Region } from 'react-native-maps';
import { View } from 'tamagui';
import { KIND_META } from '@/entities/place';
import type { Place } from '@/shared/api';
import { DEFAULT_REGION } from '@/shared/config';
import { AppMapView, AppText } from '@/shared/ui';
import { createPlaceIndex, getMapItems } from './cluster';
import { PlaceMarker } from './place-marker';

export type PlaceMapHandle = {
  focus: (coordinate: LatLng, delta?: number) => void;
};

type PlaceMapProps = {
  places: Place[];
  mapType: MapType;
  showsUserLocation: boolean;
  bottomInset: number;
  onSelectPlace: (place: Place) => void;
  onPressMap: () => void;
  onLongPressMap: (coordinate: LatLng) => void;
};

export const PlaceMap = forwardRef<PlaceMapHandle, PlaceMapProps>(function PlaceMap(
  { places, mapType, showsUserLocation, bottomInset, onSelectPlace, onPressMap, onLongPressMap },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const index = useMemo(() => createPlaceIndex(places), [places]);
  const items = useMemo(() => getMapItems(index, region), [index, region]);

  const focus: PlaceMapHandle['focus'] = (coordinate, delta = 0.05) => {
    mapRef.current?.animateToRegion(
      { ...coordinate, latitudeDelta: delta, longitudeDelta: delta },
      350,
    );
  };
  useImperativeHandle(ref, () => ({ focus }));

  return (
    <AppMapView
      ref={mapRef}
      testID="place-map"
      style={StyleSheet.absoluteFill}
      initialRegion={DEFAULT_REGION}
      mapType={mapType}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      mapPadding={{ top: 0, left: 0, right: 0, bottom: bottomInset }}
      onRegionChangeComplete={setRegion}
      onPress={(event) => {
        if (event.nativeEvent.action !== 'marker-press') onPressMap();
      }}
      onLongPress={(event) => onLongPressMap(event.nativeEvent.coordinate)}
    >
      {items.map((item) =>
        item.type === 'place' ? (
          <PlaceMarker
            key={item.place.id}
            testID={`pin-${item.place.id}`}
            coordinate={{ latitude: item.place.latitude, longitude: item.place.longitude }}
            kind={item.place.kind}
            label={`${KIND_META[item.place.kind].label}, ${item.place.name}`}
            onPress={() => onSelectPlace(item.place)}
          />
        ) : (
          <Marker
            key={`cluster-${item.id}-${item.count}`}
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            tracksViewChanges={false}
            accessibilityLabel={`장소 ${item.count}개 묶음, 확대`}
            onPress={() => {
              const delta = 360 / 2 ** item.expansionZoom;
              focus({ latitude: item.latitude, longitude: item.longitude }, delta);
            }}
          >
            <View
              width={40}
              height={40}
              borderRadius={20}
              backgroundColor="ink"
              borderWidth={2}
              borderColor="white"
              alignItems="center"
              justifyContent="center"
            >
              <AppText tone="inverse" bold size="caption">
                {item.count}
              </AppText>
            </View>
          </Marker>
        ),
      )}
    </AppMapView>
  );
});
