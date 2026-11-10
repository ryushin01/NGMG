import { FANTASY_DESTINATIONS } from './catalog-fantasy';
import { REAL_DESTINATIONS } from './catalog-real';
import { COURSES } from './courses';
import { DESTINATION_LINKS, linksOf } from './links';
import { MYTH_SPACES } from './myth';
import { READING_LINKS } from './reading';
import { TIMELINE_YEARS } from './timeline';

const ids = new Set([...REAL_DESTINATIONS, ...FANTASY_DESTINATIONS].map((item) => item.id));

it('연결, 코스, 연대표, 원전이 실제 여행지만 가리킵니다', () => {
  for (const link of DESTINATION_LINKS) {
    expect(ids).toContain(link.a);
    expect(ids).toContain(link.b);
  }
  for (const course of COURSES) for (const stop of course.stops) expect(ids).toContain(stop);
  for (const id of Object.keys(TIMELINE_YEARS)) expect(ids).toContain(id);
  for (const id of Object.keys(READING_LINKS)) expect(ids).toContain(id);
  for (const id of Object.values(MYTH_SPACES).flat()) expect(ids).toContain(id);
});

it('연결은 양쪽 여행지에서 모두 보입니다', () => {
  expect(linksOf('camelot').map((link) => link.id)).toContain('stonehenge');
  expect(linksOf('stonehenge').map((link) => link.id)).toContain('camelot');
});

it('코스의 경유지가 겹치지 않습니다', () => {
  for (const course of COURSES) expect(new Set(course.stops).size).toBe(course.stops.length);
});

it('신화 속 공간은 환상 세계이고 한 갈래에만 속합니다', () => {
  const all = Object.values(MYTH_SPACES).flat();
  expect(new Set(all).size).toBe(all.length);
  const fantasy = new Set(FANTASY_DESTINATIONS.map((item) => item.id));
  for (const id of all) expect(fantasy).toContain(id);
});
