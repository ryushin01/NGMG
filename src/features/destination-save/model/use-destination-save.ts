import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import type { Destination } from '@/entities/destination';
import { usePlaces } from '@/entities/place';
import { backend } from '@/shared/api';
import { savedByCatalogId, toCatalogPlaceInput } from './merge';

/** 빠르게 두 번 눌러도 장소가 두 개 생기지 않도록 여행지별로 잠급니다. */
export const useToggleWish = () => {
  const client = useQueryClient();
  const places = usePlaces();
  const locks = useRef(new Set<string>());
  const toggle = useMutation({
    mutationFn: async (destination: Destination) => {
      const saved = savedByCatalogId(places.data ?? []).get(destination.id);
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
  const places = usePlaces();
  return async (destination: Destination) => {
    const saved = savedByCatalogId(places.data ?? []).get(destination.id);
    if (saved) return saved.id;
    const created = await backend.places.create(toCatalogPlaceInput(destination, false));
    await client.invalidateQueries();
    return created.id;
  };
};
