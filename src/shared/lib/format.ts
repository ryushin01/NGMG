import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

export const formatDate = (iso: string) => dayjs(iso).format('YYYY. M. D. (dd)');
export const formatDateTime = (iso: string) => dayjs(iso).format('YYYY. M. D. (dd) A h:mm');
export const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;
export const formatCoordinate = (latitude: number, longitude: number) =>
  `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

/** 입력한 숫자 문자열을 숫자로 바꿉니다. 비었거나 숫자가 아니면 null입니다. */
export const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.replaceAll(',', '').trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};
