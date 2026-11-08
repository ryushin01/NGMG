import type { DestinationSource } from './types';

export const namu = (title: string): DestinationSource => ({
  label: `나무위키: ${title}`,
  url: `https://namu.wiki/w/${encodeURIComponent(title)}`,
});

export const wikipedia = (title: string): DestinationSource => ({
  label: `Wikipedia: ${title}`,
  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`,
});
