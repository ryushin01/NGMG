import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { backend } from '@/shared/api';
import { recordsToCsv, toBackupJson } from './serialize';

export type ExportFormat = 'json' | 'csv';

const MIME: Record<ExportFormat, string> = { json: 'application/json', csv: 'text/csv' };

const shareFile = async (format: ExportFormat) => {
  const [places, records, checklist] = await Promise.all([
    backend.places.list(),
    backend.records.list(),
    backend.checklist.list(),
  ]);
  const content =
    format === 'csv'
      ? recordsToCsv(records)
      : toBackupJson(places, records, checklist, new Date().toISOString());
  const file = new File(Paths.cache, `ngmg-${dayjs().format('YYYYMMDD-HHmmss')}.${format}`);
  file.create({ overwrite: true });
  file.write(content);
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: MIME[format],
      dialogTitle: '낚고먹고 내보내기',
    });
  } finally {
    // 공유가 끝나면 개인 기록 사본을 기기에 남기지 않습니다.
    if (file.exists) file.delete();
  }
};

export const useExportData = () => useMutation({ mutationFn: shareFile });
