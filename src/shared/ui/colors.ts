import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette } from '~/tamagui.config';

export type ColorName = keyof typeof lightPalette;

/** 스타일 값이 아닌 곳(아이콘, 내비게이션 등)에 쓰는 현재 모드의 색상표 */
export const useColors = () => (useColorScheme() === 'dark' ? darkPalette : lightPalette);
