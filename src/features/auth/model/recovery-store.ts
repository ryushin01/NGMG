import { create } from 'zustand';

/** 방금 발급한 복구 코드. 한 번 보여 준 뒤 지우며 기기에 저장하지 않습니다. */
type RecoveryCodeState = {
  code: string | null;
  show: (code: string) => void;
  clear: () => void;
};

export const useRecoveryCodeStore = create<RecoveryCodeState>((set) => ({
  code: null,
  show: (code) => set({ code }),
  clear: () => set({ code: null }),
}));
