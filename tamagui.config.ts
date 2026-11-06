import { createAnimations } from '@tamagui/animations-reanimated';
import { defaultConfig } from '@tamagui/config/v6';
import { createTamagui } from 'tamagui';

/**
 * 브랜드 색 #00a8ff는 흰 배경과의 명도 대비가 2.6:1이라 작은 글자에 쓸 수 없습니다.
 * 글자와 주요 버튼은 ink, 강조 글자는 brandText를 쓰고 brand는 면과 아이콘에 씁니다.
 */
const palette = {
  brand: '#00a8ff',
  brandText: '#006ea8',
  brandSoft: '#ebf6fe',
  brandBanner: '#b0e0ff',
  ink: '#1a254f',
  inkPressed: '#2a3873',
  text: '#20242c',
  muted: '#5f6673',
  line: '#e6e8ec',
  surfaceMuted: '#f4f5f7',
  white: '#ffffff',
  danger: '#c8321a',
  coral: '#ff6b4a',
  coralText: '#b23a1d',
  coralSoft: '#fff0ec',
};

/**
 * 기본 설정은 숫자를 Tailwind 토큰으로 해석해 padding={40}이 160px이 됩니다.
 * 이 앱에서 숫자는 항상 픽셀이므로 숫자 키 토큰의 값을 키와 같게 만듭니다.
 */
const toLiteralPixels = <T extends Record<string, unknown>>(tokens: T): T =>
  Object.fromEntries(
    Object.entries(tokens).map(([category, scale]) => [
      category,
      category === 'color'
        ? scale
        : Object.fromEntries(
            Object.entries(scale as Record<string, unknown>).map(([key, value]) => [
              key,
              /^-?\d+$/.test(key) ? Number(key) : value,
            ]),
          ),
    ]),
  ) as T;

/** 글자 크기도 같은 이유로 숫자를 그대로 픽셀로 씁니다. */
const literalNumbers = (scale: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [key, /^\d+$/.test(key) ? Number(key) : value]),
  );

const withLiteralFontScale = <F extends { size: object; lineHeight: object }>(font: F): F => ({
  ...font,
  size: literalNumbers(font.size as Record<string, unknown>),
  lineHeight: literalNumbers(font.lineHeight as Record<string, unknown>),
});

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  settings: { ...defaultConfig.settings, onlyAllowShorthands: false, allowedStyleValues: false },
  fonts: {
    body: withLiteralFontScale(defaultConfig.fonts.body),
    heading: withLiteralFontScale(defaultConfig.fonts.heading),
  },
  animations: createAnimations({
    quick: { type: 'timing', duration: 160, easing: 'ease-out' },
    medium: { duration: 300, bounce: 0.1 },
  }),
  tokens: toLiteralPixels({
    ...defaultConfig.tokens,
    color: { ...defaultConfig.tokens.color, ...palette },
  }),
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
