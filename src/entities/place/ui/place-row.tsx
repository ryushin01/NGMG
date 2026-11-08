import { Landmark, Sparkles } from 'lucide-react-native';
import type { Place, PlaceKind } from '@/shared/api';
import { AppIcon, ListRow } from '@/shared/ui';

export const KindIcon = ({ kind, size = 22 }: { kind: PlaceKind; size?: number }) =>
  kind === 'real' ? (
    <AppIcon icon={Landmark} size={size} color="brandText" strokeWidth={1.75} />
  ) : (
    <AppIcon icon={Sparkles} size={size} color="fantasyText" strokeWidth={1.75} />
  );

export const PlaceRow = ({ place, onPress }: { place: Place; onPress: () => void }) => (
  <ListRow
    testID={`place-row-${place.id}`}
    title={place.name}
    subtitle={`${place.kind === 'real' ? '실존' : '환상'} · 기록 ${place.recordCount}건 · ${place.address || '주소 없음'}`}
    icon={<KindIcon kind={place.kind} />}
    chevron
    onPress={onPress}
  />
);
