import { styled, Text } from 'tamagui';

// v3의 숫자 lineHeight는 글자 크기에 곱하는 배수이므로 픽셀은 문자열로 적습니다.
export const AppText = styled(Text, {
  name: 'AppText',
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
      inverse: { color: 'white' },
    },
    size: {
      caption: { fontSize: 13, lineHeight: '18px' },
      body: { fontSize: 15, lineHeight: '22px' },
      row: { fontSize: 17, lineHeight: '24px' },
      title: { fontSize: 19, lineHeight: '26px', fontWeight: '700', color: 'ink' },
      headline: { fontSize: 24, lineHeight: '32px', fontWeight: '700', color: 'ink' },
    },
    bold: { true: { fontWeight: '700' } },
  } as const,
});
