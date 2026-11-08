export const CHECKLIST_CATEGORIES = [
  '서류·예약',
  '복장',
  '탐방 장비',
  '건강·안전',
  '개인 물품',
] as const;

export const DEFAULT_CHECKLIST: { category: string; titles: string[] }[] = [
  {
    category: '서류·예약',
    titles: ['여권·비자', '유적 입장권 예약', '여행자 보험', '항공·숙소 확인', '현지 통화'],
  },
  {
    category: '복장',
    titles: ['챙 넓은 모자', '걷기 편한 신발', '어깨·무릎 가리는 옷', '방풍 겉옷'],
  },
  {
    category: '탐방 장비',
    titles: ['보조 배터리', '여행 어댑터', '카메라', '작은 손전등', '유적 지도 내려받기'],
  },
  { category: '건강·안전', titles: ['선크림', '물통', '상비약', '고산병약(고지대 유적)'] },
  { category: '개인 물품', titles: ['선글라스', '간식', '쓰레기봉투'] },
];

/** 환상 세계로 떠나는 상상 여행용 준비물입니다. */
export const FANTASY_CHECKLIST: { category: string; titles: string[] }[] = [
  { category: '서류·예약', titles: ['원전 한 권', '옛 지도 사본', '돌아올 날짜 정하기'] },
  { category: '복장', titles: ['여행자의 망토', '물에 젖어도 되는 신발'] },
  { category: '탐방 장비', titles: ['나침반', '여행 일지', '깃펜'] },
  { category: '건강·안전', titles: ['그곳의 음식을 먹지 않을 각오', '세상으로 돌아오는 길 표시'] },
  { category: '개인 물품', titles: ['사과 한 알', '복숭아 씨앗', '안내자에게 줄 선물'] },
];
