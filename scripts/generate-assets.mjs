// 앱 아이콘, 스플래시, 지도 핀을 SVG 원본에서 생성합니다. 실행: pnpm run assets
import sharp from 'sharp';

const BRAND = '#00a8ff';
const NAVY = '#1a254f';
const CORAL = '#ff6b4a';

/** 왼쪽을 보는 감성돔. 1024 캔버스 기준입니다. */
const bream = ({ mono = false } = {}) => {
  const body = mono ? '#ffffff' : 'url(#body)';
  const fin = mono ? '#ffffff' : '#141d3d';
  const stripe = mono ? 'none' : '#141d3d';
  return `
  <!-- 꼬리 -->
  <path d="M742 512 C790 468 846 400 918 356 C902 438 896 474 882 512 C896 552 904 590 918 668 C846 626 790 556 742 512 Z" fill="${fin}"/>
  <!-- 등지느러미: 감성돔 특유의 가시 -->
  <path d="M352 292 L372 214 L404 268 L436 186 L466 252 L500 176 L526 246 L564 186 L584 262 L622 214 L634 296 L672 262 L676 352 C590 300 460 272 352 292 Z" fill="${fin}"/>
  <!-- 뒷지느러미 -->
  <path d="M520 722 L546 804 L580 742 L622 780 L634 690 Z" fill="${fin}"/>
  <!-- 배지느러미 -->
  <path d="M378 716 L356 816 L438 744 Z" fill="${fin}"/>
  <!-- 몸통: 높은 등과 둥근 이마 -->
  <path d="M136 520 C160 420 262 288 430 270 C590 254 700 380 782 512 C700 640 590 758 430 750 C276 742 168 640 136 520 Z" fill="${body}"/>
  ${
    mono
      ? ''
      : `<clipPath id="bodyClip"><path d="M136 520 C160 420 262 288 430 270 C590 254 700 380 782 512 C700 640 590 758 430 750 C276 742 168 640 136 520 Z"/></clipPath>
  <g clip-path="url(#bodyClip)" opacity="0.5">
    <path d="M404 250 C386 400 386 520 404 690" stroke="${stripe}" stroke-width="34" fill="none"/>
    <path d="M504 250 C490 400 490 520 504 680" stroke="${stripe}" stroke-width="34" fill="none"/>
    <path d="M604 290 C594 400 594 520 604 650" stroke="${stripe}" stroke-width="30" fill="none"/>
    <path d="M692 380 C686 440 686 520 692 590" stroke="${stripe}" stroke-width="24" fill="none"/>
  </g>
  <!-- 아가미 -->
  <path d="M312 372 C358 454 358 572 306 662" stroke="#101833" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- 가슴지느러미 -->
  <path d="M352 524 C410 500 470 512 500 556 C450 590 390 586 352 524 Z" fill="#141d3d"/>
  <!-- 입 -->
  <path d="M138 528 C164 540 190 544 214 536" stroke="#101833" stroke-width="10" fill="none" stroke-linecap="round"/>`
  }
  <!-- 눈 -->
  <circle cx="246" cy="448" r="44" fill="${mono ? '#000000' : '#ffffff'}"/>
  ${mono ? '' : '<circle cx="240" cy="448" r="26" fill="#0d1430"/><circle cx="230" cy="438" r="8" fill="#ffffff"/>'}`;
};

const defs = `<defs>
  <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2c3a5e"/><stop offset="0.55" stop-color="#6d7b96"/><stop offset="1" stop-color="#e3e9f0"/>
  </linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#22b6ff"/><stop offset="1" stop-color="${BRAND}"/>
  </linearGradient>
</defs>`;

const svg = (inner, size = 1024) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}${inner}</svg>`;

/** 작은 크기에서도 물고기로 보이도록 키운 그룹 */
const scaled = (scale, inner) =>
  `<g transform="translate(${512 - 527 * scale} ${512 - 495 * scale}) scale(${scale})">${inner}</g>`;

const png = (source, path, size) =>
  sharp(Buffer.from(source)).resize(size, size).png().toFile(path);

await mkdir('assets/pins', { recursive: true });

await png(
  svg(`<rect width="1024" height="1024" fill="url(#sea)"/>${scaled(1.02, bream())}`),
  'assets/icon.png',
  1024,
);
await png(svg(scaled(0.68, bream())), 'assets/android-icon-foreground.png', 1024);
await png(
  svg(`<rect width="1024" height="1024" fill="${BRAND}"/>`),
  'assets/android-icon-background.png',
  1024,
);
await png(svg(scaled(0.68, bream({ mono: true }))), 'assets/android-icon-monochrome.png', 1024);
await png(svg(scaled(0.9, bream())), 'assets/splash-icon.png', 1024);
await png(
  svg(`<rect width="1024" height="1024" rx="200" fill="url(#sea)"/>${scaled(1, bream())}`),
  'assets/favicon.png',
  48,
);

// 핀은 색과 함께 도형(물고기, 포크와 나이프)으로도 종류를 구별합니다.
const pinSvg = (
  color,
  glyph,
  size,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.25)}" viewBox="0 0 48 60">
  <path d="M24 2 C12 2 3 11 3 23 C3 38 24 58 24 58 C24 58 45 38 45 23 C45 11 36 2 24 2 Z" fill="${color}" stroke="#ffffff" stroke-width="3"/>
  ${glyph}
</svg>`;
const fish = `<path d="M10 23 C15 15 26 14 32 21 L39 16 L37 23 L39 30 L32 25 C26 32 15 31 10 23 Z" fill="${NAVY}"/><circle cx="16" cy="21.5" r="1.8" fill="#ffffff"/>`;
const food = `<g stroke="${NAVY}" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M17 12 V19 C17 22 19 23 20 23 C21 23 23 22 23 19 V12"/><path d="M20 12 V34"/><path d="M30 34 V12 C27 14 26 18 26 22 C26 25 28 25 30 25"/></g>`;
for (const [name, color, glyph] of [
  ['fishing', BRAND, fish],
  ['restaurant', CORAL, food],
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
