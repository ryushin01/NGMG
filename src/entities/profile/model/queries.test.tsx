import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { backend } from '@/shared/api';
import { profileKeys, useUpdateProfile } from './queries';

let mockUserId = 'a';
let finish: (value: unknown) => void = () => undefined;
jest.mock('@/shared/api', () => ({
  backend: {
    auth: { getCachedSession: () => ({ userId: mockUserId, username: mockUserId }) },
    profile: { update: jest.fn(() => new Promise((resolve) => (finish = resolve))) },
  },
}));

const setup = async () => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useUpdateProfile(), { wrapper });
  return { client, result };
};

const profile = { nickname: '유신', name: '홍길동', avatarUrl: null };

beforeEach(() => {
  mockUserId = 'a';
});

it('저장한 프로필을 그 회원의 캐시에 넣습니다', async () => {
  const { client, result } = await setup();
  await act(async () => {
    result.current.mutate({ nickname: '유신', name: '홍길동' });
  });
  await act(async () => finish(profile));
  expect(client.getQueryData(profileKeys.me('a'))).toEqual(profile);
  expect(backend.profile.update).toHaveBeenCalled();
});

it('저장 중에 다른 계정으로 바뀌면 새 계정의 캐시에 쓰지 않습니다', async () => {
  const { client, result } = await setup();
  await act(async () => {
    result.current.mutate({ nickname: '유신', name: '홍길동' });
  });
  mockUserId = 'b';
  await act(async () => finish(profile));
  expect(client.getQueryData(profileKeys.me('b'))).toBeUndefined();
  expect(client.getQueryData(profileKeys.me('a'))).toBeUndefined();
});
