import type { Meta, StoryObj } from '@storybook/react-native';
import type { TripRecord } from '@/shared/api';
import { RecordRow } from './record-row';

const record: TripRecord = {
  id: 'r1',
  placeId: 'p1',
  placeName: '거문도 동도 갯바위',
  placeKind: 'fishing',
  visitedAt: '2026-10-18T05:30:00.000Z',
  title: '가을 감성돔 첫 출조',
  memo: '',
  partySize: 3,
  members: [],
  gear: '',
  rig: '',
  bait: '',
  weather: '',
  tide: '',
  wind: '',
  waterTemp: null,
  catches: '감성돔 42cm 1마리',
  menu: '',
  price: null,
  rating: null,
  photos: [],
};

const meta: Meta<typeof RecordRow> = {
  title: 'entities/RecordRow',
  component: RecordRow,
  args: { record, onPress: () => undefined },
};
export default meta;

export const Fishing: StoryObj<typeof RecordRow> = {};
