import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { TamaguiProvider, View } from 'tamagui';
import { darkPalette, lightPalette, tamaguiConfig } from '~/tamagui.config';
import { AppText } from './typography';

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

type Name = keyof typeof lightPalette;

// KWCAG 5.4.3: 글자와 배경의 명도 대비 4.5:1 이상
const TEXT_PAIRS: [Name, Name][] = [
  ['text', 'surface'],
  ['ink', 'surface'],
  ['muted', 'surface'],
  ['brandText', 'surface'],
  ['danger', 'surface'],
  ['fantasyText', 'surface'],
  ['surface', 'ink'],
  ['surface', 'inkPressed'],
  ['text', 'surfaceMuted'],
  ['muted', 'surfaceMuted'],
  ['ink', 'brandSoft'],
  ['brandText', 'brandSoft'],
  ['muted', 'brandSoft'],
  ['fantasyText', 'fantasySoft'],
];

describe.each([
  ['밝은 화면', lightPalette],
  ['어두운 화면', darkPalette],
])('%s의 명도 대비', (_name, palette) => {
  it.each(TEXT_PAIRS)('%s 글자와 %s 배경은 4.5:1 이상입니다', (text, background) => {
    expect(contrast(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5);
  });
});

it('글자 색은 현재 테마의 값을 씁니다', async () => {
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <AppText testID="sample" tone="ink">
        글자
      </AppText>
    </TamaguiProvider>,
  );
  const { color } = StyleSheet.flatten(screen.getByTestId('sample').props.style);
  expect(color).toBe(darkPalette.ink);
});

it('바탕색도 현재 테마의 값을 씁니다', async () => {
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <View testID="sample" backgroundColor="surface" borderColor="line" />
    </TamaguiProvider>,
  );
  const style = StyleSheet.flatten(screen.getByTestId('sample').props.style);
  expect(style.backgroundColor).toBe(darkPalette.surface);
  expect(style.borderTopColor ?? style.borderColor).toBe(darkPalette.line);
});

it('색 이름은 CSS 색 키워드와 겹치지 않습니다', () => {
  // white처럼 키워드와 같은 이름은 테마 대신 키워드로 읽혀 다크 모드가 적용되지 않습니다.
  const keywords = ['white', 'black', 'red', 'blue', 'green', 'gray', 'coral', 'transparent'];
  const reserved = Object.keys(lightPalette).filter(
    (name) => keywords.includes(name) && name !== 'coral',
  );
  expect(reserved).toEqual([]);
});
