import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, type ProfileInput } from '@/shared/api';

export const profileKeys = { me: ['profile'] as const };

export const useProfile = () =>
  useQuery({ queryKey: profileKeys.me, queryFn: () => backend.profile.get() });

export const useUpdateProfile = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => backend.profile.update(input),
    onSuccess: (profile) => client.setQueryData(profileKeys.me, profile),
  });
};
