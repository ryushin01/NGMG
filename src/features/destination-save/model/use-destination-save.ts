import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import type { Destination } from '@/entities/destination';
import { placeKeys } from '@/entities/place';
import { backend, type Place } from '@/shared/api';
import { savedByCatalogId, toCatalogPlaceInput } from './merge';

/**
 * 화면의 목록은 아직 로딩 중이거나 오래되었을 수 있어, 저장 직전에 새로 조회합니다.
 * 그러지 않으면 이미 저장한 여행지를 다시 만들어 기록이 다른 행으로 흩어집니다.
 */
const findSaved = async (destination: Destination) =>
  savedByCatalogId(await backend.places.list()).get(destination.id);

const toggled = (places: Place[], destination: Destination): Place[] =>
  places.some((place) => place.catalogId === destination.id)
    ? places.map((place) =>
        place.catalogId === destination.id ? { ...place, wishlisted: !place.wishlisted } : place,
      )
    : [
        ...places,
        {
          ...toCatalogPlaceInput(destination, true),
          id: `catalog:${destination.id}`,
          recordCount: 0,
          lastVisitedAt: null,
          createdAt: '',
        },
      ];

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
    // 서버 응답을 기다리지 않고 하트부터 바꿉니다. 실패하면 되돌립니다.
    onMutate: async (destination: Destination) => {
      await client.cancelQueries({ queryKey: placeKeys.all });
      const previous = client.getQueryData<Place[]>(placeKeys.all);
      if (previous) client.setQueryData(placeKeys.all, toggled(previous, destination));
      return { previous };
    },
    onError: (_error, _destination, context) => {
      if (context?.previous) client.setQueryData(placeKeys.all, context.previous);
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
