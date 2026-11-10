import { COURSES, DESTINATIONS, type Destination } from '@/entities/destination';
import type { CheckIn } from '@/shared/api';

export type BadgeIcon = 'footprints' | 'medal' | 'sparkles' | 'globe' | 'route';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: BadgeIcon;
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
  progress: (stamped) => countUntil(stamped, count, () => true),
});

const CONTINENTS = ['아프리카', '아메리카', '아시아', '유럽', '오세아니아'];

export const BADGES: Badge[] = [
  {
    id: 'first-step',
    name: '첫 발자국',
    description: '처음으로 현장 인증 스탬프를 찍었습니다',
    icon: 'footprints',
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
    progress: (stamped) => countUntil(stamped, 1, (item) => item.destination.realm === 'fantasy'),
  },
  {
    id: 'legend-keeper',
    name: '전설의 기록자',
    description: '환상 세계 연고지 5곳에서 인증했습니다',
    icon: 'sparkles',
    progress: (stamped) => countUntil(stamped, 5, (item) => item.destination.realm === 'fantasy'),
  },
  {
    id: 'five-continents',
    name: '다섯 대륙',
    description: '아프리카, 아메리카, 아시아, 유럽, 오세아니아의 유적을 모두 인증했습니다',
    icon: 'globe',
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
  ...COURSES.map((course): Badge => ({
    id: `course-${course.id}`,
    name: `${course.title} 완주`,
    description: `${course.title} 코스의 ${course.stops.length}곳을 모두 인증했습니다`,
    icon: 'route',
    progress: (stamped) =>
      countUntil(stamped, course.stops.length, (item) =>
        course.stops.includes(item.destination.id),
      ),
  })),
];

const byId = new Map(DESTINATIONS.map((item) => [item.id, item]));

export const toStamped = (checkins: CheckIn[]): StampedDestination[] =>
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
