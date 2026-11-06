import { Fish, Utensils } from 'lucide-react-native';
import type { Place, PlaceKind } from '@/shared/api';
import { ListRow } from '@/shared/ui';

export const KindIcon = ({ kind, size = 22 }: { kind: PlaceKind; size?: number }) =>
  kind === 'fishing' ? (
    <Fish size={size} color="#006ea8" strokeWidth={1.75} />
  ) : (
    <Utensils size={size} color="#b23a1d" strokeWidth={1.75} />
  );

export const PlaceRow = ({ place, onPress }: { place: Place; onPress: () => void }) => (
  <ListRow
    testID={`place-row-${place.id}`}
    title={place.name}
    subtitle={`${place.kind === 'fishing' ? '낚시' : '맛집'} · 기록 ${place.recordCount}건 · ${place.address || '주소 없음'}`}
    icon={<KindIcon kind={place.kind} />}
    chevron
    onPress={onPress}
  />
);
