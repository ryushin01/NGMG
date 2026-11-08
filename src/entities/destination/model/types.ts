import type { ImageSource } from 'expo-image';
import type { PlaceKind } from '@/shared/api';

export type DestinationSource = { label: string; url: string };

export type ImageCredit = { author: string; license: string; url: string };

type DestinationBase = {
  id: string;
  realm: PlaceKind;
  name: string;
  originalName: string;
  /** 카드에 쓰는 한 줄 소개 */
  tagline: string;
  /** 목록 필터에 쓰는 묶음. 실존은 대륙, 환상은 전승권입니다. */
  group: string;
  location: string;
  era: string;
  latitude: number;
  longitude: number;
  overview: string;
  highlights: string[];
  sources: DestinationSource[];
};

export type RealDestination = DestinationBase & {
  realm: 'real';
  bestSeason: string;
  tips: string[];
};

export type FantasyDestination = DestinationBase & {
  realm: 'fantasy';
  /** 처음 기록된 문헌이나 전승 */
  origin: string;
  /** 지도 핀이 실제로 무엇을 뜻하는지 */
  locationNote: string;
  /** 이곳으로 떠날 수 있는 원전·작품 */
  gateways: string[];
};

export type Destination = (RealDestination | FantasyDestination) & {
  image: ImageSource | number;
  imageCredit: ImageCredit;
};
