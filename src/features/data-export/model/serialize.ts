import type { ChecklistItem, Place, Trip, TripRecord } from '@/shared/api';

const csvCell = (value: string | number | null) => {
  const text = value === null ? '' : String(value);
  // 스프레드시트가 수식으로 실행하지 않도록 위험한 시작 문자를 막습니다.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

const COLUMNS: [string, (record: TripRecord) => string | number | null][] = [
  ['날짜', (r) => r.visitedAt],
  ['분류', (r) => (r.placeKind === 'real' ? '실존' : '환상')],
  ['장소', (r) => r.placeName],
  ['제목', (r) => r.title],
  ['인원', (r) => r.partySize],
  ['동행', (r) => r.members.join(' / ')],
  ['별점', (r) => r.rating],
  ['날씨', (r) => r.weather],
  ['기온', (r) => r.temperature],
  ['교통', (r) => r.transport],
  ['숙소', (r) => r.lodging],
  ['비용', (r) => r.cost],
  ['통화', (r) => r.currency],
  ['인상 깊은 곳', (r) => r.highlights],
  ['들어간 길', (r) => r.gateway],
  ['만난 존재', (r) => r.encounters],
  ['가져온 것', (r) => r.souvenir],
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
  trips: Trip[] = [],
) =>
  JSON.stringify(
    {
      app: 'newworld',
      version: 1,
      exportedAt,
      places,
      records: records.map((record) => ({
        ...record,
        photos: record.photos.map(({ path, width, height }) => ({ path, width, height })),
      })),
      checklist,
      trips,
    },
    null,
    2,
  );
