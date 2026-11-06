import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, type RecordSaveInput } from '@/shared/api';

export const recordKeys = {
  all: ['records'] as const,
  list: (placeId?: string) => ['records', 'list', placeId ?? 'all'] as const,
  detail: (id: string) => ['records', 'detail', id] as const,
};

export const useRecords = (placeId?: string) =>
  useQuery({
    queryKey: recordKeys.list(placeId),
    queryFn: () => backend.records.list(placeId ? { placeId } : undefined),
  });

export const useRecord = (id: string) =>
  useQuery({ queryKey: recordKeys.detail(id), queryFn: () => backend.records.get(id) });

export const useSaveRecord = (id?: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordSaveInput) =>
      id ? backend.records.update(id, input) : backend.records.create(input),
    onSuccess: () => client.invalidateQueries(),
  });
};

export const useDeleteRecord = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backend.records.remove(id),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: recordKeys.detail(id) });
      return client.invalidateQueries();
    },
  });
};
