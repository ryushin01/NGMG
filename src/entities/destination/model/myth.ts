/** 신화 속 공간 뱃지에 쓰는 갈래. 영웅 전설, 사라진 도시, 문학에서 나온 곳은 넣지 않습니다. */
export type MythSpace = 'paradise' | 'afterlife' | 'divine';

export const MYTH_SPACE_LABELS: Record<MythSpace, string> = {
  paradise: '낙원',
  afterlife: '저승',
  divine: '신들의 거처',
};

export const MYTH_SPACES: Record<MythSpace, string[]> = {
  paradise: [
    'eden',
    'dilmun',
    'aaru',
    'elysion',
    'tir-na-nog',
    'peach-blossom',
    'penglai',
    'nirai-kanai',
  ],
  afterlife: ['hades', 'yomi', 'xibalba', 'valhalla'],
  divine: ['olympus', 'asgard', 'sumeru', 'kunlun', 'takamagahara'],
};

export const mythSpaceOf = (id: string) =>
  (Object.keys(MYTH_SPACES) as MythSpace[]).find((space) => MYTH_SPACES[space].includes(id));
