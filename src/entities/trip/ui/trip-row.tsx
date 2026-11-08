import { Route } from 'lucide-react-native';
import type { Trip } from '@/shared/api';
import { AppIcon, ListRow } from '@/shared/ui';
import { formatTripDates } from '../model/format';

export const TripRow = ({ trip, onPress }: { trip: Trip; onPress: () => void }) => (
  <ListRow
    testID={`trip-row-${trip.id}`}
    title={trip.title}
    subtitle={`${formatTripDates(trip)} · ${trip.stops.length}곳`}
    icon={<AppIcon icon={Route} size={22} color="brandText" strokeWidth={1.75} />}
    chevron
    onPress={onPress}
  />
);
