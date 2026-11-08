import { PlaceRow } from './place-row';

const place = {
  id: 'p',
  name: '마추픽추',
  kind: 'real' as const,
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
    place: { ...place, name: '아발론', kind: 'fantasy' },
    onPress: () => undefined,
  },
};
