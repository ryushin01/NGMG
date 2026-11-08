import type { ChecklistItem } from '@/shared/api';
import { CHECKLIST_CATEGORIES, DEFAULT_CHECKLIST, FANTASY_CHECKLIST } from './defaults';

export type ChecklistSection = { category: string; items: ChecklistItem[] };

/** 기본 분류 순서를 지키고, 그 외 분류는 뒤에 붙입니다. 빈 분류는 뺍니다. */
export const groupChecklist = (items: ChecklistItem[]): ChecklistSection[] => {
  const known: string[] = [...CHECKLIST_CATEGORIES];
  const others = [...new Set(items.map((item) => item.category))].filter(
    (category) => !known.includes(category),
  );
  return [...known, ...others]
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((section) => section.items.length > 0);
};

export const DEFAULT_LIST_NAME = '기본';

const buildItems = (
  source: typeof DEFAULT_CHECKLIST,
  newId: () => string,
  listName: string,
): ChecklistItem[] =>
  source
    .flatMap(({ category, titles }) =>
      titles.map((title) => ({ id: newId(), title, category, checked: false, listName })),
    )
    .map((item, position) => ({ ...item, position }));

export const buildDefaultItems = (newId: () => string, listName = DEFAULT_LIST_NAME) =>
  buildItems(DEFAULT_CHECKLIST, newId, listName);

export const buildFantasyItems = (newId: () => string, listName = DEFAULT_LIST_NAME) =>
  buildItems(FANTASY_CHECKLIST, newId, listName);

/** 처음 만든 순서대로 목록 이름을 돌려줍니다. */
export const listNames = (items: ChecklistItem[]) => [
  ...new Set(items.map((item) => item.listName)),
];

/** 다음 여행을 위해 항목만 복사합니다. 체크는 지웁니다. */
export const copyList = (
  items: ChecklistItem[],
  listName: string,
  newId: () => string,
): ChecklistItem[] => {
  const start = nextPosition(items);
  return items.map((item, index) => ({
    ...item,
    id: newId(),
    listName,
    checked: false,
    position: start + index,
  }));
};

/** 목록이 하나면 진행률을, 여럿이면 목록 개수를 보여 줍니다. */
export const summarizeChecklist = (items: ChecklistItem[]) => {
  if (items.length === 0) return undefined;
  const names = listNames(items);
  if (names.length > 1) return `목록 ${names.length}개`;
  return `${items.length}개 중 ${items.filter((item) => item.checked).length}개 챙김`;
};

export const nextPosition = (items: ChecklistItem[]) =>
  items.reduce((max, item) => Math.max(max, item.position), -1) + 1;
