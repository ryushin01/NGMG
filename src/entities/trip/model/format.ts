import type { Trip } from '@/shared/api';

const dot = (date: string) => date.replaceAll('-', '.');

export const formatTripDates = ({ startDate, endDate }: Pick<Trip, 'startDate' | 'endDate'>) => {
  if (startDate && endDate) return `${dot(startDate)} ~ ${dot(endDate)}`;
  if (startDate) return `${dot(startDate)} 출발`;
  if (endDate) return `${dot(endDate)} 귀국`;
  return '날짜 미정';
};
