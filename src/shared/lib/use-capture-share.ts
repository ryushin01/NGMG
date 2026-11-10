import * as Sharing from 'expo-sharing';
import { useRef, useState, type RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';

type CaptureOptions = { dialogTitle: string; format?: 'jpg' | 'png' };

/**
 * 화면에 보이는 뷰를 이미지로 찍어 공유 창을 엽니다. iOS는 화면 밖 뷰를 찍지 못하므로 보이는 상태에서 부릅니다.
 * 찍는 동안 다시 누르면 공유 창이 겹치므로 ref로 막습니다. 실패하면 false를 돌려줍니다.
 */
export const useCaptureShare = () => {
  const busy = useRef(false);
  const [sharing, setSharing] = useState(false);

  const share = async (
    target: RefObject<unknown>,
    { dialogTitle, format = 'jpg' }: CaptureOptions,
  ) => {
    if (busy.current) return true;
    busy.current = true;
    setSharing(true);
    try {
      const uri = await captureRef(target as Parameters<typeof captureRef>[0], {
        format,
        quality: format === 'jpg' ? 0.9 : 1,
      });
      await Sharing.shareAsync(uri, {
        mimeType: format === 'jpg' ? 'image/jpeg' : 'image/png',
        dialogTitle,
      });
      return true;
    } catch {
      return false;
    } finally {
      busy.current = false;
      setSharing(false);
    }
  };

  return { share, sharing };
};
