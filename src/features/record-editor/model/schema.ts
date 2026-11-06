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
  gear: z.string(),
  rig: z.string(),
  bait: z.string(),
  weather: z.string(),
  tide: z.string(),
  wind: z.string(),
  waterTemp: optionalNumber('수온', -5, 45),
  catches: z.string(),
  menu: z.string(),
  price: optionalNumber('가격', 0, 100000000),
  rating: z.number().nullable(),
});

export type RecordFormValues = z.infer<typeof recordFormSchema>;

const EMPTY: Omit<RecordFormValues, 'visitedAt'> = {
  title: '',
  memo: '',
  partySize: '',
  members: [],
  gear: '',
  rig: '',
  bait: '',
  weather: '',
  tide: '',
  wind: '',
  waterTemp: '',
  catches: '',
  menu: '',
  price: '',
  rating: null,
};

export const toFormValues = (record?: TripRecord): RecordFormValues => {
  if (!record) return { ...EMPTY, visitedAt: new Date().toISOString() };
  return {
    visitedAt: record.visitedAt,
    title: record.title,
    memo: record.memo,
    partySize: record.partySize?.toString() ?? '',
    members: record.members,
    gear: record.gear,
    rig: record.rig,
    bait: record.bait,
    weather: record.weather,
    tide: record.tide,
    wind: record.wind,
    waterTemp: record.waterTemp?.toString() ?? '',
    catches: record.catches,
    menu: record.menu,
    price: record.price?.toString() ?? '',
    rating: record.rating,
  };
};

/** 분류에 맞지 않는 항목은 비워서 저장합니다. 장소 분류가 바뀐 기록의 값이 섞이지 않게 합니다. */
export const toRecordInput = (
  placeId: string,
  kind: PlaceKind,
  values: RecordFormValues,
): RecordInput => {
  const fishing = kind === 'fishing';
  return {
    placeId,
    visitedAt: values.visitedAt,
    title: values.title.trim(),
    memo: values.memo.trim(),
    partySize: parseOptionalNumber(values.partySize),
    members: values.members,
    gear: fishing ? values.gear.trim() : '',
    rig: fishing ? values.rig.trim() : '',
    bait: fishing ? values.bait.trim() : '',
    weather: fishing ? values.weather.trim() : '',
    tide: fishing ? values.tide.trim() : '',
    wind: fishing ? values.wind.trim() : '',
    waterTemp: fishing ? parseOptionalNumber(values.waterTemp) : null,
    catches: fishing ? values.catches.trim() : '',
    menu: fishing ? '' : values.menu.trim(),
    price: fishing ? null : parseOptionalNumber(values.price),
    rating: fishing ? null : values.rating,
  };
};
