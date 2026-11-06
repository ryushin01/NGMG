import { z } from 'zod';
import type { PlaceInput } from '@/shared/api';

export const placeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '장소 이름을 입력해 주세요.')
    .max(100, '100자 이내로 입력해 주세요.'),
  kind: z.enum(['fishing', 'restaurant']),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  memo: z.string(),
  tags: z.array(z.string()),
}) satisfies z.ZodType<PlaceInput>;
