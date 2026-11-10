import { useRef } from 'react';

/**
 * 저장 요청을 한 번만 보내도록 잠급니다. isPending은 다음 렌더에야 바뀌어 빠른 연속 누름을 막지 못합니다.
 * 성공하면 화면을 떠나는 폼은 실패했을 때만 release로 풉니다.
 */
export const useSubmitLock = () => {
  const lock = useRef(false);
  return {
    take: () => {
      if (lock.current) return false;
      lock.current = true;
      return true;
    },
    release: () => {
      lock.current = false;
    },
  };
};
