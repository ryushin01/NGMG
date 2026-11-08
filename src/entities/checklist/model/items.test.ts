import {
  buildDefaultItems,
  buildFantasyItems,
  copyList,
  groupChecklist,
  listNames,
  nextPosition,
  summarizeChecklist,
} from './items';

const item = (category: string, position = 0) => ({
  id: `${category}-${position}`,
  title: 't',
  category,
  checked: false,
  position,
  listName: '기본',
});

it('기본 분류 순서대로 묶고 사용자 분류는 뒤에 둡니다', () => {
  const sections = groupChecklist([item('기타'), item('건강·안전'), item('복장')]);
  expect(sections.map((section) => section.category)).toEqual(['복장', '건강·안전', '기타']);
});

it('기본 목록은 고유한 id와 순서를 가지며 체크되어 있지 않습니다', () => {
  let n = 0;
  const items = buildDefaultItems(() => `id-${(n += 1)}`);
  expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  expect(items.map((i) => i.position)).toEqual(items.map((_, index) => index));
  expect(items.every((i) => !i.checked)).toBe(true);
  expect(items.map((i) => i.title)).toContain('여권·비자');
});

it('환상 여행 목록은 별도의 준비물로 시작합니다', () => {
  let n = 0;
  const items = buildFantasyItems(() => `id-${(n += 1)}`, '아발론');
  expect(items.every((i) => i.listName === '아발론')).toBe(true);
  expect(items.map((i) => i.title)).toContain('원전 한 권');
});

it('다음 순서는 가장 큰 값 다음입니다', () => {
  expect(nextPosition([])).toBe(0);
  expect(nextPosition([item('a', 3), item('b', 1)])).toBe(4);
});

describe('목록 나누기', () => {
  const a = { ...item('장비', 0), checked: true };
  const b = { ...item('안전', 1), listName: '거문도' };

  it('만든 순서대로 목록 이름을 돌려줍니다', () => {
    expect(listNames([a, b, a])).toEqual(['기본', '거문도']);
  });

  it('복사하면 새 id와 뒤 순서를 받고 체크가 지워지며 원본은 그대로입니다', () => {
    const copied = copyList([a], '여수', () => 'new');
    expect(copied).toEqual([{ ...a, id: 'new', listName: '여수', checked: false, position: 1 }]);
    expect(a.checked).toBe(true);
  });

  it('목록 수에 따라 요약을 바꿉니다', () => {
    expect(summarizeChecklist([])).toBeUndefined();
    expect(summarizeChecklist([a])).toBe('1개 중 1개 챙김');
    expect(summarizeChecklist([a, b])).toBe('목록 2개');
  });
});
