import type { PlaceKind } from '@/shared/api';

export const PLACE_KINDS: PlaceKind[] = ['real', 'fantasy'];

export const KIND_META: Record<
  PlaceKind,
  { label: string; pin: number; background: string; text: string }
> = {
  real: {
    label: '실존 유적',
    pin: require('~/assets/pins/real.png'),
    background: 'brandSoft',
    text: 'brandText',
  },
  fantasy: {
    label: '환상 세계',
    pin: require('~/assets/pins/fantasy.png'),
    background: 'fantasySoft',
    text: 'fantasyText',
  },
};
