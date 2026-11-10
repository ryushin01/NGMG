import { pickDaily } from './daily';
import type { Destination } from './types';

const make = (id: string, realm: 'real' | 'fantasy') => ({ id, realm }) as Destination;
const list = [make('a', 'real'), make('b', 'real'), make('c', 'real'), make('x', 'fantasy')];

it('같은 날에는 같은 여행지를 고릅니다', () => {
  const morning = new Date(2026, 10, 10, 8);
  const night = new Date(2026, 10, 10, 23);
  expect(pickDaily(list, 'real', morning)?.id).toBe(pickDaily(list, 'real', night)?.id);
});

it('분류 안에서만 고르고, 날마다 바뀔 수 있습니다', () => {
  const days = Array.from(
    { length: 30 },
    (_, i) => pickDaily(list, 'real', new Date(2026, 0, i + 1))?.id,
  );
  expect(days.every((id) => ['a', 'b', 'c'].includes(id ?? ''))).toBe(true);
  expect(new Set(days).size).toBeGreaterThan(1);
  expect(pickDaily(list, 'fantasy')?.id).toBe('x');
});

it('해당 분류가 비어 있으면 없음입니다', () => {
  expect(pickDaily([make('a', 'real')], 'fantasy')).toBeUndefined();
});
