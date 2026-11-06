import type { ChecklistItem } from '@/shared/api';
import { CHECKLIST_CATEGORIES, DEFAULT_CHECKLIST } from './defaults';

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

export const buildDefaultItems = (newId: () => string): ChecklistItem[] =>
  DEFAULT_CHECKLIST.flatMap(({ category, titles }) =>
    titles.map((title) => ({ id: newId(), title, category, checked: false })),
  ).map((item, position) => ({ ...item, position }));

export const nextPosition = (items: ChecklistItem[]) =>
  items.reduce((max, item) => Math.max(max, item.position), -1) + 1;
