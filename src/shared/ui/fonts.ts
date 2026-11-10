import { GowunBatang_400Regular, GowunBatang_700Bold } from '@expo-google-fonts/gowun-batang';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import { useFonts } from 'expo-font';

/**
 * 글꼴 역할. 본문은 굵기가 다양한 시스템 글꼴을 그대로 쓰고, 제목과 영문 원어명에만 웹폰트를 씁니다.
 * 이름은 useFonts에 넘긴 키라 iOS와 Android에서 같습니다.
 */
export const FONT = {
  heading: 'GowunBatang_700Bold',
  headingRegular: 'GowunBatang_400Regular',
  latin: 'Marcellus_400Regular',
} as const;

/** 글꼴을 불러온 뒤 true입니다. 실패해도 시스템 글꼴로 계속하도록 true를 돌려줍니다. */
export const useAppFonts = () => {
  const [loaded, error] = useFonts({
    [FONT.heading]: GowunBatang_700Bold,
    [FONT.headingRegular]: GowunBatang_400Regular,
    [FONT.latin]: Marcellus_400Regular,
  });
  return loaded || !!error;
};
