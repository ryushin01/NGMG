import type { Meta, StoryObj } from '@storybook/react-native';
import type { TripRecord } from '@/shared/api';
import { RecordRow } from './record-row';

const record: TripRecord = {
  id: 'r1',
  placeId: 'p1',
  placeName: '마추픽추',
  placeKind: 'real',
  visitedAt: '2026-10-18T05:30:00.000Z',
  title: '구름이 걷히던 아침',
  memo: '',
  partySize: 3,
  members: [],
  rating: null,
  weather: '',
  temperature: null,
  transport: '',
  lodging: '',
  cost: null,
  highlights: '문지기의 집에서 내려다본 전경',
  gateway: '',
  encounters: '',
  souvenir: '',
  photos: [],
};

const meta: Meta<typeof RecordRow> = {
  title: 'entities/RecordRow',
  component: RecordRow,
  args: { record, onPress: () => undefined },
};
export default meta;

export const Fishing: StoryObj<typeof RecordRow> = {};
