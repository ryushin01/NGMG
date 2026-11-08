import { z } from 'zod';
import type { PlaceKind, RecordInput, TripRecord } from '@/shared/api';
import { parseOptionalNumber } from '@/shared/lib';

const optionalNumber = (label: string, min: number, max: number) =>
  z.string().refine(
    (value) => {
      if (!value.trim()) return true;
      const parsed = parseOptionalNumber(value);
      return parsed !== null && parsed >= min && parsed <= max;
    },
    { message: `${label}은(는) ${min}에서 ${max} 사이 숫자로 입력해 주세요.` },
  );

export const recordFormSchema = z.object({
  visitedAt: z.string(),
  title: z.string().max(100, '100자 이내로 입력해 주세요.'),
  memo: z.string(),
  partySize: optionalNumber('인원', 1, 100),
  members: z.array(z.string()),
  rating: z.number().nullable(),
  weather: z.string(),
  temperature: optionalNumber('기온', -60, 60),
  transport: z.string(),
  lodging: z.string(),
  cost: optionalNumber('비용', 0, 1000000000),
  currency: z.string(),
  highlights: z.string(),
  gateway: z.string(),
  encounters: z.string(),
  souvenir: z.string(),
});

export type RecordFormValues = z.infer<typeof recordFormSchema>;

const EMPTY: Omit<RecordFormValues, 'visitedAt'> = {
  title: '',
  memo: '',
  partySize: '',
  members: [],
  rating: null,
  weather: '',
  temperature: '',
  transport: '',
  lodging: '',
  cost: '',
  currency: 'KRW',
  highlights: '',
  gateway: '',
  encounters: '',
  souvenir: '',
};

export const toFormValues = (record?: TripRecord): RecordFormValues => {
  if (!record) return { ...EMPTY, visitedAt: new Date().toISOString() };
  return {
    visitedAt: record.visitedAt,
    title: record.title,
    memo: record.memo,
    partySize: record.partySize?.toString() ?? '',
    members: record.members,
    rating: record.rating,
    weather: record.weather,
    temperature: record.temperature?.toString() ?? '',
    transport: record.transport,
    lodging: record.lodging,
    cost: record.cost?.toString() ?? '',
    currency: record.currency,
    highlights: record.highlights,
    gateway: record.gateway,
    encounters: record.encounters,
    souvenir: record.souvenir,
  };
};

/** 분류에 맞지 않는 항목은 비워서 저장합니다. 장소 분류가 바뀐 기록의 값이 섞이지 않게 합니다. */
export const toRecordInput = (
  placeId: string,
  kind: PlaceKind,
  values: RecordFormValues,
): RecordInput => {
  const real = kind === 'real';
  return {
    placeId,
    visitedAt: values.visitedAt,
    title: values.title.trim(),
    memo: values.memo.trim(),
    partySize: parseOptionalNumber(values.partySize),
    members: values.members,
    rating: values.rating,
    weather: real ? values.weather.trim() : '',
    temperature: real ? parseOptionalNumber(values.temperature) : null,
    transport: real ? values.transport.trim() : '',
    lodging: real ? values.lodging.trim() : '',
    cost: real ? parseOptionalNumber(values.cost) : null,
    currency: values.currency,
    highlights: real ? values.highlights.trim() : '',
    gateway: real ? '' : values.gateway.trim(),
    encounters: real ? '' : values.encounters.trim(),
    souvenir: real ? '' : values.souvenir.trim(),
  };
};
