import { createAnimations } from '@tamagui/animations-reanimated';
import { defaultConfig } from '@tamagui/config/v6';
import { createTamagui } from 'tamagui';

/**
 * 브랜드 색 #00a8ff는 흰 배경과의 명도 대비가 2.6:1이라 작은 글자에 쓸 수 없습니다.
 * 글자와 주요 버튼은 ink, 강조 글자는 brandText를 쓰고 brand는 면과 아이콘에 씁니다.
 */
export const lightPalette = {
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
  surface: '#ffffff',
  danger: '#c8321a',
  coral: '#ff6b4a',
  coralText: '#b23a1d',
  coralSoft: '#fff0ec',
};

/**
 * 이름은 쓰임새를 뜻합니다. 어두운 화면에서 ink는 밝은 면, surface는 어두운 바탕이 되므로
 * ink 버튼 위 surface 글자처럼 짝지어 쓴 곳의 대비가 그대로 유지됩니다.
 */
export const darkPalette: typeof lightPalette = {
  brand: '#00a8ff',
  brandText: '#5cc6ff',
  brandSoft: '#14303f',
  brandBanner: '#0e4a6b',
  ink: '#e9edf7',
  inkPressed: '#c9d0e3',
  text: '#e7e9ee',
  muted: '#a3aab6',
  line: '#2c313b',
  surfaceMuted: '#1a1e26',
  surface: '#12151c',
  danger: '#ff8a75',
  coral: '#ff6b4a',
  coralText: '#ff9d86',
  coralSoft: '#3a1f18',
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
  themes: {
    ...defaultConfig.themes,
    light: { ...defaultConfig.themes.light, ...lightPalette },
    dark: { ...defaultConfig.themes.dark, ...darkPalette },
  },
  // 색 이름을 토큰에도 넣으면 토큰이 테마보다 먼저 읽혀 다크 모드가 적용되지 않습니다.
  tokens: toLiteralPixels(defaultConfig.tokens),
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
