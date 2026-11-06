import { PlaceRow } from './place-row';

const place = {
  id: 'p',
  name: '거문도 동도 갯바위',
  kind: 'fishing' as const,
  address: '전남 여수시 삼산면 거문리',
  latitude: 34,
  longitude: 127,
  memo: '',
  tags: [],
  recordCount: 2,
  lastVisitedAt: null,
  createdAt: '',
};

export default { title: 'entities/PlaceRow', component: PlaceRow };

export const Fishing = { args: { place, onPress: () => undefined } };
export const Restaurant = {
  args: {
    place: { ...place, name: '여수 바다식당', kind: 'restaurant' },
    onPress: () => undefined,
  },
};
