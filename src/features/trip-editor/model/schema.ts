import { z } from 'zod';

export const tripSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '여정 이름을 입력해 주세요.')
      .max(100, '100자 이내로 입력해 주세요.'),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    stops: z.array(z.string()).min(1, '여행지를 한 곳 이상 넣어 주세요.'),
    memo: z.string(),
  })
  .refine((trip) => !trip.startDate || !trip.endDate || trip.startDate <= trip.endDate, {
    path: ['endDate'],
    message: '돌아오는 날은 출발일 이후여야 합니다.',
  });

export type TripFormValues = z.infer<typeof tripSchema>;

/** 순서를 바꿀 수 없는 위치면 그대로 돌려줍니다. */
export const moveStop = (stops: string[], index: number, delta: -1 | 1) => {
  const target = index + delta;
  if (target < 0 || target >= stops.length) return stops;
  const next = [...stops];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};
