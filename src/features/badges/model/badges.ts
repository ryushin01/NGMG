import { COURSES, DESTINATIONS, MYTH_SPACES, type Destination } from '@/entities/destination';
import type { CheckIn } from '@/shared/api';

export type BadgeIcon =
  | 'footprints'
  | 'medal'
  | 'sparkles'
  | 'globe'
  | 'route'
  | 'door'
  | 'paradise'
  | 'afterlife'
  | 'divine'
  | 'compass';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  /** 환상 세계 계열 뱃지는 보라색으로 보여 줍니다. */
  tone: 'real' | 'fantasy';
  /** 인증 스탬프로 얼마나 채웠는지와 목표. 목표에 닿은 순간의 인증 날짜가 획득일입니다. */
  progress: (stamped: StampedDestination[]) => {
    current: number;
    target: number;
    earnedAt: string | null;
  };
};

export type StampedDestination = { destination: Destination; checkedAt: string };

export type BadgeStatus = {
  badge: Badge;
  current: number;
  target: number;
  earned: boolean;
  earnedAt: string | null;
};

/** 조건에 맞는 인증을 날짜순으로 세고, target번째가 찍힌 날을 획득일로 봅니다. */
const countUntil = (
  stamped: StampedDestination[],
  target: number,
  match: (item: StampedDestination) => boolean,
) => {
  const hits = stamped.filter(match);
  return {
    current: Math.min(hits.length, target),
    target,
    earnedAt: hits.length >= target ? hits[target - 1].checkedAt : null,
  };
};

const collector = (count: number, name: string): Badge => ({
  id: `collector-${count}`,
  name,
  description: `현장 인증 스탬프 ${count}개`,
  icon: 'medal',
  tone: 'real',
  progress: (stamped) => countUntil(stamped, count, () => true),
});

const CONTINENTS = ['아프리카', '아메리카', '아시아', '유럽', '오세아니아'];

const isMyth = (item: StampedDestination) => item.destination.lore === 'myth';
const inSpace = (space: keyof typeof MYTH_SPACES) => (item: StampedDestination) =>
  MYTH_SPACES[space].includes(item.destination.id);

/** 신화 속 공간 모험 뱃지. 낙원, 저승, 신들의 거처를 각각 모으고 모두 합쳐 셉니다. */
const MYTH_BADGES: Badge[] = [
  {
    id: 'myth-gate',
    name: '신화의 문',
    description: '신화 속 장소의 현실 연고지에서 처음 인증했습니다',
    icon: 'door',
    tone: 'fantasy',
    progress: (stamped) => countUntil(stamped, 1, isMyth),
  },
  {
    id: 'myth-paradise',
    name: '낙원을 찾아서',
    description: '에덴, 엘리시온, 무릉도원 같은 낙원 3곳에서 인증했습니다',
    icon: 'paradise',
    tone: 'fantasy',
    progress: (stamped) => countUntil(stamped, 3, inSpace('paradise')),
  },
  {
    id: 'myth-afterlife',
    name: '저승 순례자',
    description: '하데스의 명계, 요미노쿠니, 시발바 같은 저승 3곳에서 인증했습니다',
    icon: 'afterlife',
    tone: 'fantasy',
    progress: (stamped) => countUntil(stamped, 3, inSpace('afterlife')),
  },
  {
    id: 'myth-divine',
    name: '신들의 거처',
    description: '올림포스, 아스가르드, 수미산 같은 신들의 거처 3곳에서 인증했습니다',
    icon: 'divine',
    tone: 'fantasy',
    progress: (stamped) => countUntil(stamped, 3, inSpace('divine')),
  },
  {
    id: 'myth-odyssey',
    name: '신화 대모험',
    description: '신화 속 장소 10곳에서 인증했습니다',
    icon: 'compass',
    tone: 'fantasy',
    progress: (stamped) => countUntil(stamped, 10, isMyth),
  },
];

export const BADGES: Badge[] = [
  {
    id: 'first-step',
    name: '첫 발자국',
    description: '처음으로 현장 인증 스탬프를 찍었습니다',
    icon: 'footprints',
    tone: 'real',
    progress: (stamped) => countUntil(stamped, 1, () => true),
  },
  collector(5, '스탬프 수집가'),
  collector(10, '노련한 탐험가'),
  collector(25, '세계를 걷는 사람'),
  {
    id: 'legend-walker',
    name: '전설을 걷다',
    description: '환상 세계의 현실 연고지에서 처음 인증했습니다',
    icon: 'sparkles',
    tone: 'fantasy',
    progress: (stamped) => countUntil(stamped, 1, (item) => item.destination.realm === 'fantasy'),
  },
  {
    id: 'legend-keeper',
    name: '전설의 기록자',
    description: '환상 세계 연고지 5곳에서 인증했습니다',
    icon: 'sparkles',
    tone: 'fantasy',
    progress: (stamped) => countUntil(stamped, 5, (item) => item.destination.realm === 'fantasy'),
  },
  {
    id: 'five-continents',
    name: '다섯 대륙',
    description: '아프리카, 아메리카, 아시아, 유럽, 오세아니아의 유적을 모두 인증했습니다',
    icon: 'globe',
    tone: 'real',
    progress: (stamped) => {
      const seen: string[] = [];
      let earnedAt: string | null = null;
      for (const item of stamped) {
        const group = item.destination.group;
        if (
          item.destination.realm !== 'real' ||
          !CONTINENTS.includes(group) ||
          seen.includes(group)
        )
          continue;
        seen.push(group);
        if (seen.length === CONTINENTS.length) earnedAt = item.checkedAt;
      }
      return { current: seen.length, target: CONTINENTS.length, earnedAt };
    },
  },
  ...MYTH_BADGES,
  ...COURSES.map((course): Badge => ({
    id: `course-${course.id}`,
    name: `${course.title} 완주`,
    description: `${course.title} 코스의 ${course.stops.length}곳을 모두 인증했습니다`,
    icon: 'route',
    tone: 'real',
    progress: (stamped) =>
      countUntil(stamped, course.stops.length, (item) =>
        course.stops.includes(item.destination.id),
      ),
  })),
];

const byId = new Map(DESTINATIONS.map((item) => [item.id, item]));

const toStamped = (checkins: CheckIn[]): StampedDestination[] =>
  [...checkins]
    .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
    .flatMap((checkin) => {
      const destination = byId.get(checkin.catalogId);
      return destination ? [{ destination, checkedAt: checkin.checkedAt }] : [];
    });

export const evaluateBadges = (checkins: CheckIn[], badges = BADGES): BadgeStatus[] => {
  const stamped = toStamped(checkins);
  return badges.map((badge) => {
    const { current, target, earnedAt } = badge.progress(stamped);
    return { badge, current, target, earned: earnedAt !== null, earnedAt };
  });
};

/** 인증 전후를 비교해 이번에 새로 받은 뱃지만 돌려줍니다. */
export const newlyEarned = (before: CheckIn[], after: CheckIn[]) => {
  const had = new Set(
    evaluateBadges(before)
      .filter((item) => item.earned)
      .map((item) => item.badge.id),
  );
  return evaluateBadges(after).filter((item) => item.earned && !had.has(item.badge.id));
};
