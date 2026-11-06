import type { ChecklistItem, Place, TripRecord } from '@/shared/api';

const csvCell = (value: string | number | null) => {
  const text = value === null ? '' : String(value);
  // 스프레드시트가 수식으로 실행하지 않도록 위험한 시작 문자를 막습니다.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

const COLUMNS: [string, (record: TripRecord) => string | number | null][] = [
  ['날짜', (r) => r.visitedAt],
  ['분류', (r) => (r.placeKind === 'fishing' ? '낚시' : '맛집')],
  ['장소', (r) => r.placeName],
  ['제목', (r) => r.title],
  ['인원', (r) => r.partySize],
  ['멤버', (r) => r.members.join(' / ')],
  ['장비', (r) => r.gear],
  ['채비', (r) => r.rig],
  ['미끼', (r) => r.bait],
  ['날씨', (r) => r.weather],
  ['물때', (r) => r.tide],
  ['바람', (r) => r.wind],
  ['수온', (r) => r.waterTemp],
  ['조과', (r) => r.catches],
  ['메뉴', (r) => r.menu],
  ['가격', (r) => r.price],
  ['별점', (r) => r.rating],
  ['사진 수', (r) => r.photos.length],
  ['메모', (r) => r.memo],
];

/** 엑셀에서 한글이 깨지지 않도록 BOM을 붙입니다. */
export const recordsToCsv = (records: TripRecord[]) =>
  `﻿${[
    COLUMNS.map(([name]) => name).join(','),
    ...records.map((record) => COLUMNS.map(([, read]) => csvCell(read(record))).join(',')),
  ].join('\r\n')}`;

/** 서명 URL은 만료되고 내용 유출 위험이 있어 내보내지 않습니다. */
export const toBackupJson = (
  places: Place[],
  records: TripRecord[],
  checklist: ChecklistItem[],
  exportedAt: string,
) =>
  JSON.stringify(
    {
      app: 'ngmg',
      version: 1,
      exportedAt,
      places,
      records: records.map((record) => ({
        ...record,
        photos: record.photos.map(({ path, width, height }) => ({ path, width, height })),
      })),
      checklist,
    },
    null,
    2,
  );
