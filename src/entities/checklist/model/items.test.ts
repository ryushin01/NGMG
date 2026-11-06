import { buildDefaultItems, groupChecklist, nextPosition } from './items';

const item = (category: string, position = 0) => ({
  id: `${category}-${position}`,
  title: 't',
  category,
  checked: false,
  position,
});

it('기본 분류 순서대로 묶고 사용자 분류는 뒤에 둡니다', () => {
  const sections = groupChecklist([item('기타'), item('안전'), item('장비')]);
  expect(sections.map((section) => section.category)).toEqual(['장비', '안전', '기타']);
});

it('기본 목록은 고유한 id와 순서를 가지며 체크되어 있지 않습니다', () => {
  let n = 0;
  const items = buildDefaultItems(() => `id-${(n += 1)}`);
  expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  expect(items.map((i) => i.position)).toEqual(items.map((_, index) => index));
  expect(items.every((i) => !i.checked)).toBe(true);
  expect(items.map((i) => i.title)).toContain('구명조끼');
});

it('다음 순서는 가장 큰 값 다음입니다', () => {
  expect(nextPosition([])).toBe(0);
  expect(nextPosition([item('a', 3), item('b', 1)])).toBe(4);
});
