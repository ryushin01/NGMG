import { styled, Text } from 'tamagui';
import { Platform } from 'react-native';
import { FONT } from './fonts';

/** 고운돋움은 굵기가 400 하나라, 굵은 본문은 운영체제 글꼴의 굵은 체로 씁니다(iOS는 없는 굵기를 만들지 않습니다). */
const SYSTEM_FONT = Platform.select({ ios: 'System', default: 'sans-serif' });

// v3의 숫자 lineHeight는 글자 크기에 곱하는 배수이므로 픽셀은 문자열로 적습니다.
export const AppText = styled(Text, {
  name: 'AppText',
  fontFamily: FONT.body,
  color: 'text',
  fontSize: 15,
  lineHeight: '22px',
  variants: {
    tone: {
      default: { color: 'text' },
      ink: { color: 'ink' },
      muted: { color: 'muted' },
      brand: { color: 'brandText' },
      danger: { color: 'danger' },
      inverse: { color: 'surface' },
    },
    size: {
      caption: { fontSize: 13, lineHeight: '18px' },
      body: { fontSize: 15, lineHeight: '22px' },
      row: { fontSize: 17, lineHeight: '24px' },
      // 제목은 고운바탕 굵은 체입니다. 글꼴 파일 자체가 굵어 fontWeight를 더하지 않습니다(Android 이중 굵기 방지).
      title: { fontSize: 19, lineHeight: '28px', fontFamily: FONT.heading, color: 'ink' },
      headline: { fontSize: 24, lineHeight: '34px', fontFamily: FONT.heading, color: 'ink' },
    },
    bold: { true: { fontFamily: SYSTEM_FONT, fontWeight: '700' } },
    /** 여행지 영문 원어명처럼 라틴 문자로만 된 짧은 이름 */
    latin: { true: { fontFamily: FONT.latin, letterSpacing: 0.5 } },
  } as const,
});
