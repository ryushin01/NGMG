import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, type PlaceInput } from '@/shared/api';

export const placeKeys = {
  all: ['places'] as const,
  detail: (id: string) => ['places', id] as const,
};

export const usePlaces = () =>
  useQuery({ queryKey: placeKeys.all, queryFn: () => backend.places.list() });

export const usePlace = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: placeKeys.detail(id),
    queryFn: () => backend.places.get(id),
    enabled: options?.enabled,
  });

export const useSavePlace = (id?: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceInput) =>
      id ? backend.places.update(id, input) : backend.places.create(input),
    onSuccess: () => client.invalidateQueries(),
  });
};

export const useDeletePlace = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backend.places.remove(id),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: placeKeys.detail(id) });
      return client.invalidateQueries();
    },
  });
};
