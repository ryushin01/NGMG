import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, type Trip } from '@/shared/api';

const tripKeys = { all: ['trips'] as const };

export const useTrips = () =>
  useQuery({ queryKey: tripKeys.all, queryFn: () => backend.trips.list() });

export const useTrip = (id: string) => {
  const trips = useTrips();
  return { ...trips, data: trips.data?.find((trip) => trip.id === id) };
};

export const useSaveTrip = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (trip: Trip) => backend.trips.save(trip),
    onSuccess: () => client.invalidateQueries({ queryKey: tripKeys.all }),
  });
};

export const useDeleteTrip = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backend.trips.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: tripKeys.all }),
  });
};
