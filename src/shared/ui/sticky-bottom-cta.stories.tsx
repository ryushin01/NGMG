import { StickyBottomCta } from './sticky-bottom-cta';

export default { title: 'shared/StickyBottomCta', component: StickyBottomCta };

export const Default = { args: { label: '저장하기', onPress: () => undefined } };
export const Loading = { args: { label: '저장하기', loading: true, onPress: () => undefined } };
