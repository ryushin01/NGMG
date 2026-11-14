// 앱 아이콘, 스플래시, 지도 핀을 SVG 원본에서 생성합니다. 실행: pnpm run assets
import { mkdir, readFile, rm } from 'node:fs/promises';
import sharp from 'sharp';

const INK = '#2a2233';
const GOLD = '#b8862b';

/** 보물 지도(game-icons.net의 Lorc “Treasure map”, CC BY 3.0, 금색으로 칠함). 1024 캔버스 가운데 720px에 둡니다. */
const mapPath = (await readFile('assets/brand/treasure-map.svg', 'utf8')).match(
  /<path[^>]* d="([^"]+)"/,
)[1];
const treasureMap = ({ mono = false } = {}) =>
  `<g transform="translate(152 152) scale(1.40625)"><path d="${mapPath}" fill="${mono ? '#ffffff' : GOLD}"/></g>`;

const svg = (inner, size = 1024) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${inner}</svg>`;

/** 안드로이드 적응형 아이콘의 안전 영역에 맞게 줄입니다. */
const scaled = (scale, inner) =>
  `<g transform="translate(${512 - 512 * scale} ${512 - 512 * scale}) scale(${scale})">${inner}</g>`;

const png = (source, path, size) =>
  sharp(Buffer.from(source)).resize(size, size).png().toFile(path);

const background = `<rect width="1024" height="1024" fill="${INK}"/>`;

await mkdir('assets/pins', { recursive: true });
await png(svg(`${background}${treasureMap()}`), 'assets/icon.png', 1024);
await png(svg(scaled(0.68, treasureMap())), 'assets/android-icon-foreground.png', 1024);
await png(svg(background), 'assets/android-icon-background.png', 1024);
await png(
  svg(scaled(0.68, treasureMap({ mono: true }))),
  'assets/android-icon-monochrome.png',
  1024,
);
// Android 알림 작은 아이콘은 투명 바탕의 흰색 단색이어야 합니다.
await png(svg(scaled(0.9, treasureMap({ mono: true }))), 'assets/notification-icon.png', 96);
await png(
  svg(`<rect width="1024" height="1024" rx="220" fill="${INK}"/>${scaled(0.9, treasureMap())}`),
  'assets/splash-icon.png',
  1024,
);
await png(svg(`${background}${treasureMap()}`), 'assets/favicon.png', 48);

// 핀은 색과 함께 도형(계단 피라미드, 별)으로도 종류를 구별합니다.
const pinSvg = (
  color,
  glyph,
  size,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.25)}" viewBox="0 0 48 60">
  <path d="M24 2 C12 2 3 11 3 23 C3 38 24 58 24 58 C24 58 45 38 45 23 C45 11 36 2 24 2 Z" fill="${color}" stroke="#ffffff" stroke-width="3"/>
  ${glyph}
</svg>`;
const ruin = `<g fill="#ffffff"><rect x="12" y="29" width="24" height="5" rx="1"/><rect x="15.5" y="23" width="17" height="5" rx="1"/><rect x="19" y="17" width="10" height="5" rx="1"/><rect x="22" y="12" width="4" height="4" rx="1"/></g>`;
const star = `<path d="M24 10 L27.5 19.5 L37 23 L27.5 26.5 L24 36 L20.5 26.5 L11 23 L20.5 19.5 Z" fill="#ffffff"/>`;
await Promise.all(
  ['fishing', 'restaurant'].flatMap((name) =>
    ['', '@2x', '@3x'].map((suffix) => rm(`assets/pins/${name}${suffix}.png`, { force: true })),
  ),
);
// 현장 인증한 곳은 오른쪽 위에 흰 원과 체크를 더해 색 없이도 구별합니다.
const verified = (color) =>
  `<circle cx="38" cy="10" r="9" fill="#ffffff" stroke="${color}" stroke-width="2.5"/><path d="M33.5 10.2 L36.8 13.4 L42.6 6.8" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
for (const [name, color, glyph] of [
  ['real', '#a9631f', ruin],
  ['fantasy', '#6a48e8', star],
  ['real-verified', '#a9631f', ruin + verified('#a9631f')],
  ['fantasy-verified', '#6a48e8', star + verified('#6a48e8')],
]) {
  for (const [suffix, scale] of [
    ['', 1],
    ['@2x', 2],
    ['@3x', 3],
  ]) {
    const size = 40 * scale;
    await sharp(Buffer.from(pinSvg(color, glyph, size)))
      .png()
      .toFile(`assets/pins/${name}${suffix}.png`);
  }
}
console.log('에셋을 생성했습니다.');
