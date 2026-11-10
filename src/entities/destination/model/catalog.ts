import { LORE_LABELS } from './myth';
import type { PlaceKind } from '@/shared/api';
import { FANTASY_DESTINATIONS } from './catalog-fantasy';
import { REAL_DESTINATIONS } from './catalog-real';
import { DESTINATION_IMAGES } from './images';
import type { Destination } from './types';

export const DESTINATIONS: Destination[] = [...REAL_DESTINATIONS, ...FANTASY_DESTINATIONS].map(
  (item) => ({ ...item, ...DESTINATION_IMAGES[item.id] }),
);

const byId = new Map(DESTINATIONS.map((item) => [item.id, item]));

export const findDestination = (id: string) => byId.get(id);

const groupsOf = (realm: PlaceKind) => [
  ...new Set(DESTINATIONS.filter((item) => item.realm === realm).map((item) => item.group)),
];

export const REAL_GROUPS = groupsOf('real');
export const FANTASY_GROUPS = groupsOf('fantasy');

/** 이름, 원어, 지역, 한 줄 소개에서 찾습니다. */
export const searchDestinations = (keyword: string, realm?: PlaceKind) => {
  const term = keyword.trim().toLowerCase();
  return DESTINATIONS.filter(
    (item) =>
      (!realm || item.realm === realm) &&
      (!term ||
        [item.name, item.originalName, item.location, item.tagline, LORE_LABELS[item.lore]].some(
          (value) => value.toLowerCase().includes(term),
        )),
  );
};
