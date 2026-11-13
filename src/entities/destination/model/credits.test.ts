import fs from 'node:fs';
import path from 'node:path';

import { DESTINATIONS } from './catalog';
import type { Destination } from './types';

/**
 * 여행지 사진과 소개 글 참고 자료의 출처 목록(docs/credits.md)을 데이터에서 만듭니다.
 * 출처는 화면이 아니라 README와 이 문서에 둡니다. `pnpm credits`로 다시 만들고,
 * 데이터와 어긋나면 이 테스트가 실패합니다.
 */
const DOC = path.join(__dirname, '../../../../docs/credits.md');

const cell = (text: string) => text.replaceAll('|', '\\|');
const link = (label: string, url: string) => `[${cell(label)}](${url})`;

const row = (item: Destination) =>
  `| ${cell(item.name)} | ${link(item.imageCredit.author, item.imageCredit.url)} | ${cell(item.imageCredit.license)} | ${item.sources.map((source) => link(source.label, source.url)).join(' · ')} |`;

const table = (items: Destination[]) => [
  '| 여행지 | 사진 저작자 | 사진 사용 허락 | 소개 글 참고 자료 |',
  '|---|---|---|---|',
  ...items.map(row),
];

export const creditsMarkdown = () =>
  [
    '# 자료·사진 출처',
    '',
    '여행지마다 화면에 쓴 사진과 소개 글의 참고 자료입니다. `pnpm credits`로 데이터(`src/entities/destination/model`)에서 다시 만들고, 데이터와 어긋나면 `credits.test.ts`가 실패합니다.',
    '',
    '- 사진: [Wikimedia Commons](https://commons.wikimedia.org)에서 받아 줄인 webp입니다. 사용 허락은 사진마다 다르며, CC BY·CC BY-SA 사진은 저작자와 사용 허락을 이 표에 밝히고 원본으로 연결합니다.',
    '- 참고 자료: 소개 글에서 참고한 위키백과·나무위키 문서입니다.',
    '',
    '## 실존 여행지',
    '',
    ...table(DESTINATIONS.filter((item) => item.realm === 'real')),
    '',
    '## 환상 여행지',
    '',
    ...table(DESTINATIONS.filter((item) => item.realm === 'fantasy')),
    '',
  ].join('\n');

it('출처 목록(docs/credits.md)이 여행지 데이터와 같습니다', () => {
  const markdown = creditsMarkdown();
  if (process.env.UPDATE_CREDITS === '1') fs.writeFileSync(DOC, markdown);
  expect(fs.readFileSync(DOC, 'utf8')).toBe(markdown);
});

it('모든 여행지에 사진 출처와 참고 자료가 있습니다', () => {
  for (const item of DESTINATIONS) {
    expect(item.imageCredit.author.length).toBeGreaterThan(0);
    expect(item.imageCredit.url).toMatch(/^https:\/\//);
    expect(item.sources.length).toBeGreaterThan(0);
  }
});
