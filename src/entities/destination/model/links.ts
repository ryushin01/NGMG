/** 전설과 실제 장소, 또는 서로 이어지는 전승을 잇습니다. 양쪽 화면에 함께 표시됩니다. */
export type DestinationLink = { a: string; b: string; note: string };

export const DESTINATION_LINKS: DestinationLink[] = [
  {
    a: 'camelot',
    b: 'stonehenge',
    note: '몬머스의 제프리는 멀린이 아일랜드에서 이 돌들을 옮겨 왔다고 썼습니다.',
  },
  { a: 'avalon', b: 'stonehenge', note: '같은 잉글랜드 남서부에 있어 함께 돌아보기 좋습니다.' },
  {
    a: 'avalon',
    b: 'camelot',
    note: '아서왕은 카멜롯을 다스리다 상처를 입고 아발론으로 떠납니다.',
  },
  { a: 'avalon', b: 'tir-na-nog', note: '서쪽 바다 너머의 켈트 낙원이라는 뿌리를 나눕니다.' },
  {
    a: 'atlantis',
    b: 'knossos',
    note: '테라 화산 폭발을 겪은 미노스 문명이 전설의 모델이라는 가설이 있습니다.',
  },
  {
    a: 'atlantis',
    b: 'acropolis',
    note: '플라톤의 이야기에서 아틀란티스를 물리치는 나라가 고대 아테네입니다.',
  },
  { a: 'olympus', b: 'acropolis', note: '파르테논은 올림포스 신 아테나에게 바친 신전입니다.' },
  { a: 'utopia', b: 'atlantis', note: '플라톤의 이상 국가 논의가 모어의 유토피아로 이어졌습니다.' },
  {
    a: 'el-dorado',
    b: 'machu-picchu',
    note: '잉카 정복으로 얻은 황금이 더 큰 황금 도시를 찾는 열풍을 불렀습니다.',
  },
  { a: 'el-dorado', b: 'cibola', note: '둘 다 신대륙의 황금 소문이 정복자를 움직인 사례입니다.' },
  { a: 'sumeru', b: 'angkor-wat', note: '중앙 성소의 탑들은 우주의 산 메루를 형상화했습니다.' },
  { a: 'sumeru', b: 'borobudur', note: '층층이 오르는 구조를 불교 우주관의 입체화로 해석합니다.' },
  { a: 'shambhala', b: 'shangri-la', note: '샹그릴라는 샴발라 전승에서 영향을 받았다고 봅니다.' },
  { a: 'penglai', b: 'terracotta', note: '진시황은 불사약을 구하러 서불을 봉래로 보냈습니다.' },
  { a: 'penglai', b: 'gyeongju', note: '동궁과 월지의 세 섬은 삼신산을 본떴다고 전합니다.' },
  { a: 'penglai', b: 'kunlun', note: '동쪽의 봉래와 서쪽의 곤륜은 신선 세계의 두 축입니다.' },
  {
    a: 'peach-blossom',
    b: 'terracotta',
    note: '무릉도원의 주민들은 진나라의 난을 피해 숨어든 사람들입니다.',
  },
  { a: 'eden', b: 'dilmun', note: '딜문의 신화를 에덴 이야기의 먼 뿌리로 보는 학자도 있습니다.' },
  { a: 'hades', b: 'elysion', note: '베르길리우스는 엘리시온을 명계 안의 낙원으로 그렸습니다.' },
  { a: 'valhalla', b: 'asgard', note: '발할라는 아스가르드에 있는 오딘의 전당입니다.' },
  {
    a: 'yomi',
    b: 'takamagahara',
    note: '저승에서 돌아온 이자나기가 몸을 씻을 때 아마테라스가 태어납니다.',
  },
  {
    a: 'xibalba',
    b: 'chichen-itza',
    note: '대구기장의 공놀이는 쌍둥이 영웅이 시발바에서 벌인 공놀이와 이어집니다.',
  },
  {
    a: 'aztlan',
    b: 'teotihuacan',
    note: '아스틀란을 떠나온 메시카는 폐허가 된 테오티우아칸을 신들이 태어난 곳으로 여겼습니다.',
  },
  { a: 'ys', b: 'atlantis', note: '바다에 잠긴 도시라 브르타뉴의 아틀란티스라고도 부릅니다.' },
  {
    a: 'nirai-kanai',
    b: 'penglai',
    note: '동쪽 바다 너머의 낙원이라는 점에서 봉래 전설과 닮았습니다.',
  },
];

export const linksOf = (id: string) =>
  DESTINATION_LINKS.flatMap((link) =>
    link.a === id
      ? [{ id: link.b, note: link.note }]
      : link.b === id
        ? [{ id: link.a, note: link.note }]
        : [],
  );
