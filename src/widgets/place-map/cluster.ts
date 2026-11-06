import Supercluster from 'supercluster';
import type { Region } from 'react-native-maps';
import type { Place } from '@/shared/api';

export type MapItem =
  | { type: 'place'; place: Place }
  | {
      type: 'cluster';
      id: number;
      count: number;
      latitude: number;
      longitude: number;
      expansionZoom: number;
    };

export const regionToZoom = (region: Pick<Region, 'longitudeDelta'>) =>
  Math.round(Math.log2(360 / region.longitudeDelta));

export const createPlaceIndex = (places: Place[]) => {
  const index = new Supercluster<{ place: Place }>({ radius: 48, maxZoom: 16 });
  index.load(
    places.map((place) => ({
      type: 'Feature',
      properties: { place },
      geometry: { type: 'Point', coordinates: [place.longitude, place.latitude] },
    })),
  );
  return index;
};

export const getMapItems = (index: Supercluster<{ place: Place }>, region: Region): MapItem[] => {
  const west = region.longitude - region.longitudeDelta / 2;
  const east = region.longitude + region.longitudeDelta / 2;
  const south = region.latitude - region.latitudeDelta / 2;
  const north = region.latitude + region.latitudeDelta / 2;
  return index.getClusters([west, south, east, north], regionToZoom(region)).map((feature) => {
    const properties = feature.properties;
    if ('cluster' in properties && properties.cluster) {
      const [longitude, latitude] = feature.geometry.coordinates;
      const id = properties.cluster_id;
      return {
        type: 'cluster',
        id,
        count: properties.point_count,
        latitude,
        longitude,
        expansionZoom: index.getClusterExpansionZoom(id),
      };
    }
    return { type: 'place', place: (properties as { place: Place }).place };
  });
};
