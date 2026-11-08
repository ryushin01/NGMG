import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import type { Destination } from '@/entities/destination';
import { backend } from '@/shared/api';
import { savedByCatalogId, toCatalogPlaceInput } from './merge';

/**
 * 화면의 목록은 아직 로딩 중이거나 오래되었을 수 있어, 저장 직전에 새로 조회합니다.
 * 그러지 않으면 이미 저장한 여행지를 다시 만들어 기록이 다른 행으로 흩어집니다.
 */
const findSaved = async (destination: Destination) =>
  savedByCatalogId(await backend.places.list()).get(destination.id);

/** 빠르게 두 번 눌러도 장소가 두 개 생기지 않도록 여행지별로 잠급니다. */
export const useToggleWish = () => {
  const client = useQueryClient();
  const locks = useRef(new Set<string>());
  const toggle = useMutation({
    mutationFn: async (destination: Destination) => {
      const saved = await findSaved(destination);
      if (!saved) return backend.places.create(toCatalogPlaceInput(destination, true));
      const { id, recordCount, lastVisitedAt, createdAt, ...input } = saved;
      return backend.places.update(id, { ...input, wishlisted: !saved.wishlisted });
    },
    onSettled: () => client.invalidateQueries(),
  });
  return (destination: Destination, options?: { onError?: (error: unknown) => void }) => {
    if (locks.current.has(destination.id)) return;
    locks.current.add(destination.id);
    toggle.mutate(destination, {
      onError: options?.onError,
      onSettled: () => locks.current.delete(destination.id),
    });
  };
};

/** 기록을 처음 저장할 때 여행지를 장소로 등록하고 그 id를 돌려줍니다. */
export const useEnsureCatalogPlace = () => {
  const client = useQueryClient();
  return async (destination: Destination) => {
    const saved = await findSaved(destination);
    if (saved) return saved.id;
    const created = await backend.places.create(toCatalogPlaceInput(destination, false));
    await client.invalidateQueries();
    return created.id;
  };
};
