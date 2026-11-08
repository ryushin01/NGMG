import type { Destination } from '@/entities/destination';
import type { Place, PlaceInput } from '@/shared/api';

export const toCatalogPlaceInput = (destination: Destination, wishlisted: boolean): PlaceInput => ({
  name: destination.name,
  kind: destination.realm,
  address: destination.location,
  latitude: destination.latitude,
  longitude: destination.longitude,
  memo: '',
  tags: [destination.group],
  catalogId: destination.id,
  wishlisted,
});

export const savedByCatalogId = (places: Place[]) =>
  new Map(places.flatMap((place) => (place.catalogId ? [[place.catalogId, place]] : [])));

/** 지도에는 수록된 여행지 전부와 직접 추가한 장소를 함께 보여 줍니다. */
export const mergeCatalogPlaces = (destinations: Destination[], places: Place[]): Place[] => {
  const saved = savedByCatalogId(places);
  return [
    ...destinations.map(
      (destination): Place =>
        saved.get(destination.id) ?? {
          ...toCatalogPlaceInput(destination, false),
          id: `catalog:${destination.id}`,
          recordCount: 0,
          lastVisitedAt: null,
          createdAt: '',
        },
    ),
    ...places.filter((place) => !place.catalogId),
  ];
};
