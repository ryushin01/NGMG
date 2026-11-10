export type Course = { id: string; title: string; summary: string; stops: string[] };

/** 실존 유적과 전설의 땅을 잇는 추천 코스입니다. */
export const COURSES: Course[] = [
  {
    id: 'arthur',
    title: '아서왕의 길',
    summary: '거석의 평원에서 시작해 원탁의 성을 지나 사과의 섬으로 향합니다.',
    stops: ['stonehenge', 'camelot', 'avalon', 'tir-na-nog'],
  },
  {
    id: 'aegean',
    title: '에게해의 미궁과 신들',
    summary: '미궁의 궁전과 신들의 산, 가라앉은 섬의 이야기를 함께 따라갑니다.',
    stops: ['knossos', 'atlantis', 'acropolis', 'olympus', 'arcadia', 'elysion'],
  },
  {
    id: 'gold',
    title: '황금을 찾아서',
    summary: '잉카의 도시에서 출발해 정복자들이 끝내 찾지 못한 황금의 땅을 좇습니다.',
    stops: ['machu-picchu', 'el-dorado', 'cibola'],
  },
  {
    id: 'immortal',
    title: '불로불사의 동방',
    summary: '영원을 꿈꾼 황제의 무덤에서 신선의 섬과 복사꽃 마을로 떠납니다.',
    stops: ['terracotta', 'penglai', 'peach-blossom', 'kunlun', 'gyeongju'],
  },
  {
    id: 'center',
    title: '세계의 중심 산',
    summary: '돌로 지은 우주의 산에서 눈에 보이지 않는 왕국까지 오릅니다.',
    stops: ['angkor-wat', 'borobudur', 'sumeru', 'shambhala', 'shangri-la'],
  },
  {
    id: 'edge',
    title: '세상의 끝',
    summary: '세계의 배꼽이라 불린 섬에서 해가 지지 않는 북쪽 끝까지 갑니다.',
    stops: ['rapa-nui', 'thule', 'asgard'],
  },
  {
    id: 'afterlife',
    title: '저승 순례',
    summary:
      '갈대의 들판에서 그리스의 명계와 일본의 요미를 지나 마야의 시발바까지 죽은 이들의 길을 따라갑니다.',
    stops: ['aaru', 'hades', 'valhalla', 'yomi', 'chichen-itza', 'xibalba'],
  },
  {
    id: 'paradise',
    title: '잃어버린 낙원',
    summary: '네 강이 흐르던 동산에서 바다 너머 신의 섬까지, 사람들이 그려 온 낙원을 모읍니다.',
    stops: ['eden', 'dilmun', 'elysion', 'tir-na-nog', 'nirai-kanai'],
  },
  {
    id: 'mesoamerica',
    title: '아메리카 신들의 길',
    summary:
      '백로의 섬을 떠난 메시카의 이주 길을 따라 신들이 태어난 도시와 마야의 저승으로 갑니다.',
    stops: ['aztlan', 'teotihuacan', 'chichen-itza', 'tikal', 'xibalba'],
  },
];

export const findCourse = (id: string) => COURSES.find((course) => course.id === id);
