import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { backend } from '@/shared/api';

const DEBOUNCE_MS = 300;

export const usePlaceSearch = (query: string) => {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  return useQuery({
    queryKey: ['place-search', debounced],
    queryFn: () => backend.search.places(debounced),
    enabled: debounced.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    meta: { persist: false },
  });
};
