import type { Place } from '@/shared/api';

/** 하트를 끄고 기록도 없는 수록 여행지는 저장된 행이 남아 있어도 목록에 보이지 않습니다. */
export const isListedPlace = (place: Place) =>
  !place.catalogId || place.wishlisted || place.recordCount > 0;
