/** 신화(lore: 'myth') 가운데 낙원·저승·신들의 거처. 신화 모험 뱃지에 씁니다. */
export type MythSpace = 'paradise' | 'afterlife' | 'divine';

export const MYTH_SPACE_LABELS: Record<MythSpace, string> = {
  paradise: '낙원',
  afterlife: '저승',
  divine: '신들의 거처',
};

export const MYTH_SPACES: Record<MythSpace, string[]> = {
  paradise: ['eden', 'dilmun', 'aaru', 'elysion', 'tir-na-nog', 'penglai', 'nirai-kanai'],
  afterlife: ['hades', 'yomi', 'xibalba', 'valhalla'],
  divine: ['olympus', 'asgard', 'sumeru', 'kunlun', 'takamagahara'],
};

export const mythSpaceOf = (id: string) =>
  (Object.keys(MYTH_SPACES) as MythSpace[]).find((space) => MYTH_SPACES[space].includes(id));

/** 여행지의 분류. 환상 세계는 신화와 전설, 실존 유적은 역사와 사실로 나눕니다. */
export type Lore = 'myth' | 'legend' | 'history' | 'fact';

export const LORE_LABELS: Record<Lore, string> = {
  myth: '신화',
  legend: '전설',
  history: '역사',
  fact: '사실',
};

export const LORES_BY_REALM = { real: ['history', 'fact'], fantasy: ['myth', 'legend'] } as const;
