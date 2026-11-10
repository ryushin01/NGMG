import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, type ProfileInput } from '@/shared/api';

/** 계정이 바뀌어도 이전 사람의 프로필이 보이지 않도록 회원 id를 키에 넣습니다. */
export const profileKeys = { me: (userId: string) => ['profile', userId] as const };

const currentUserId = () => backend.auth.getCachedSession()?.userId ?? '';

export const useProfile = () => {
  const userId = currentUserId();
  return useQuery({
    queryKey: profileKeys.me(userId),
    queryFn: () => backend.profile.get(),
    enabled: userId !== '',
    // 본명과 1시간짜리 사진 주소가 들어 있어 기기 캐시에 남기지 않습니다.
    meta: { persist: false },
  });
};

export const useUpdateProfile = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => backend.profile.update(input),
    onSuccess: (profile) => client.setQueryData(profileKeys.me(currentUserId()), profile),
  });
};
