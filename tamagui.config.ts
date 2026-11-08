import { createAnimations } from '@tamagui/animations-reanimated';
import { defaultConfig } from '@tamagui/config/v6';
import { createTamagui } from 'tamagui';

/**
 * 실존 유적은 사암색(brand), 환상 세계는 보라색(fantasy)으로 나눕니다.
 * brand는 작은 글자 대비가 낮을 수 있어 글자와 주요 버튼은 ink, 강조 글자는 brandText를 씁니다.
 */
export const lightPalette = {
  brand: '#c2792b',
  brandText: '#85491a',
  brandSoft: '#f8efe3',
  brandBanner: '#eed9bc',
  ink: '#2a2233',
  inkPressed: '#40354c',
  text: '#26222b',
  muted: '#625d6b',
  line: '#e8e4df',
  surfaceMuted: '#f5f2ee',
  surface: '#ffffff',
  danger: '#c8321a',
  fantasy: '#7a5af8',
  fantasyText: '#5b3fd1',
  fantasySoft: '#f0ecfe',
};

/**
 * 이름은 쓰임새를 뜻합니다. 어두운 화면에서 ink는 밝은 면, surface는 어두운 바탕이 되므로
 * ink 버튼 위 surface 글자처럼 짝지어 쓴 곳의 대비가 그대로 유지됩니다.
 */
export const darkPalette: typeof lightPalette = {
  brand: '#d99a55',
  brandText: '#ecc08f',
  brandSoft: '#33261a',
  brandBanner: '#57402a',
  ink: '#f0ebe5',
  inkPressed: '#d6cfc5',
  text: '#ebe7e2',
  muted: '#aca6b2',
  line: '#322d38',
  surfaceMuted: '#201c26',
  surface: '#16131b',
  danger: '#ff8a75',
  fantasy: '#9d85ff',
  fantasyText: '#c2b2ff',
  fantasySoft: '#272042',
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
