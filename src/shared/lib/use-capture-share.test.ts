import { act, renderHook } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useCaptureShare } from './use-capture-share';

jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));

it('빠르게 두 번 눌러도 한 번만 찍어 공유합니다', async () => {
  let finish: (uri: string) => void = () => undefined;
  jest.mocked(captureRef).mockReturnValue(new Promise((resolve) => (finish = resolve)));
  const { result } = await renderHook(() => useCaptureShare());
  const target = { current: {} };
  let first: Promise<boolean> = Promise.resolve(false);
  await act(async () => {
    first = result.current.share(target, { dialogTitle: '공유' });
    await result.current.share(target, { dialogTitle: '공유' });
  });
  await act(async () => {
    finish('file:///card.jpg');
    expect(await first).toBe(true);
  });
  expect(captureRef).toHaveBeenCalledTimes(1);
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///card.jpg', {
    mimeType: 'image/jpeg',
    dialogTitle: '공유',
  });
});

it('이미지를 만들지 못하면 false를 돌려줍니다', async () => {
  jest.mocked(captureRef).mockRejectedValue(new Error('fail'));
  const { result } = await renderHook(() => useCaptureShare());
  let ok = true;
  await act(async () => {
    ok = await result.current.share({ current: {} }, { dialogTitle: '공유' });
  });
  expect(ok).toBe(false);
});
