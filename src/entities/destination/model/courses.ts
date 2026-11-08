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
];

export const findCourse = (id: string) => COURSES.find((course) => course.id === id);
