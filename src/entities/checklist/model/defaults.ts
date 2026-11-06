export const CHECKLIST_CATEGORIES = ['장비', '채비·소품', '미끼', '안전', '개인 물품'] as const;

export const DEFAULT_CHECKLIST: { category: string; titles: string[] }[] = [
  { category: '장비', titles: ['낚싯대', '릴', '받침대', '뜰채', '두레박', '아이스박스'] },
  { category: '채비·소품', titles: ['원줄·목줄', '찌', '바늘', '봉돌', '가위·니퍼', '칼'] },
  { category: '미끼', titles: ['크릴', '집어제', '밑밥통·주걱'] },
  { category: '안전', titles: ['구명조끼', '갯바위 신발', '장갑', '구급약', '보조 배터리'] },
  { category: '개인 물품', titles: ['모자', '방한복·우비', '물과 식사', '쓰레기봉투'] },
];
