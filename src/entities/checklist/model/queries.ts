import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, type ChecklistItem } from '@/shared/api';

export const checklistKey = ['checklist'] as const;

export const useChecklist = () =>
  useQuery({ queryKey: checklistKey, queryFn: () => backend.checklist.list() });

const useOptimistic = <T>(
  mutationFn: (input: T) => Promise<void>,
  apply: (current: ChecklistItem[], input: T) => ChecklistItem[],
) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    // 신호가 약한 유적지에서도 바로 체크되도록 응답을 기다리지 않고 화면부터 바꿉니다.
    onMutate: async (input: T) => {
      await client.cancelQueries({ queryKey: checklistKey });
      const previous = client.getQueryData<ChecklistItem[]>(checklistKey);
      client.setQueryData<ChecklistItem[]>(checklistKey, apply(previous ?? [], input));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(checklistKey, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: checklistKey }),
  });
};

export const useUpsertChecklist = () =>
  useOptimistic(
    (items: ChecklistItem[]) => backend.checklist.upsert(items),
    (current, items) => {
      const ids = new Set(items.map((item) => item.id));
      return [...current.filter((item) => !ids.has(item.id)), ...items].sort(
        (a, b) => a.position - b.position,
      );
    },
  );

export const useRemoveChecklist = () =>
  useOptimistic(
    (ids: string[]) => backend.checklist.remove(ids),
    (current, ids) => current.filter((item) => !ids.includes(item.id)),
  );
