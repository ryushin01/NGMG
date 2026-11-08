import type { DestinationSource } from './types';

const gutenberg = (label: string, id: number): DestinationSource => ({
  label,
  url: `https://www.gutenberg.org/ebooks/${id}`,
});

/** 저작권이 끝난 원전을 읽을 수 있는 곳입니다. 대부분 영어 번역본입니다. */
export const READING_LINKS: Record<string, DestinationSource[]> = {
  avalon: [gutenberg('맬러리 《아서왕의 죽음》 (영어)', 1251)],
  camelot: [gutenberg('테니슨 《왕의 목가》 (영어)', 610)],
  atlantis: [
    gutenberg('플라톤 《크리티아스》 (영어)', 1571),
    gutenberg('베이컨 《새로운 아틀란티스》 (영어)', 2434),
    gutenberg('베른 《해저 2만 리》 (영어)', 164),
  ],
  elysion: [
    gutenberg('베르길리우스 《아이네이스》 (영어)', 228),
    gutenberg('호메로스 《오디세이아》 (영어)', 1727),
  ],
  olympus: [
    gutenberg('호메로스 《일리아스》 (영어)', 6130),
    gutenberg('헤시오도스 《신통기》 외 (영어)', 348),
  ],
  asgard: [gutenberg('스노리 《산문 에다》 (영어)', 18947)],
  utopia: [
    gutenberg('모어 《유토피아》 (영어)', 2130),
    gutenberg('캄파넬라 《태양의 도시》 (영어)', 2816),
  ],
  'peach-blossom': [
    {
      label: '도연명 《도화원기》 (한문 원문)',
      url: 'https://zh.wikisource.org/wiki/%E6%A1%83%E8%8A%B1%E6%BA%90%E8%A8%98',
    },
  ],
  'el-dorado': [gutenberg('볼테르 《캉디드》 (영어)', 19942)],
};
