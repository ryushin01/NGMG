import type { PlaceKind } from '@/shared/api';

export const PLACE_KINDS: PlaceKind[] = ['fishing', 'restaurant'];

export const KIND_META: Record<
  PlaceKind,
  { label: string; pin: number; background: string; text: string }
> = {
  fishing: {
    label: '낚시 포인트',
    pin: require('~/assets/pins/fishing.png'),
    background: 'brandSoft',
    text: 'brandText',
  },
  restaurant: {
    label: '맛집',
    pin: require('~/assets/pins/restaurant.png'),
    background: 'coralSoft',
    text: 'coralText',
  },
};
