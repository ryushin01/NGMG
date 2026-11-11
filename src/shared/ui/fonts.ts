import { GowunBatang_400Regular, GowunBatang_700Bold } from '@expo-google-fonts/gowun-batang';
import { GowunDodum_400Regular } from '@expo-google-fonts/gowun-dodum';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import { useFonts } from 'expo-font';

/**
 * 글꼴 역할. 제목은 고운바탕, 본문은 같은 가족인 고운돋움, 영문 원어명은 Marcellus입니다.
 * 고운돋움은 굵기가 하나라 굵은 본문은 시스템 글꼴의 굵은 체로 씁니다(`typography.tsx`).
 * 이름은 useFonts에 넘긴 키라 iOS와 Android에서 같습니다.
 */
export const FONT = {
  heading: 'GowunBatang_700Bold',
  headingRegular: 'GowunBatang_400Regular',
  latin: 'Marcellus_400Regular',
  body: 'GowunDodum_400Regular',
} as const;

/** 글꼴을 불러온 뒤 true입니다. 실패해도 시스템 글꼴로 계속하도록 true를 돌려줍니다. */
export const useAppFonts = () => {
  const [loaded, error] = useFonts({
    [FONT.heading]: GowunBatang_700Bold,
    [FONT.headingRegular]: GowunBatang_400Regular,
    [FONT.latin]: Marcellus_400Regular,
    [FONT.body]: GowunDodum_400Regular,
  });
  return loaded || !!error;
};
