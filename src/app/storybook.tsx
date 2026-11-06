import { Redirect } from 'expo-router';
import StorybookUI from '~/.rnstorybook';

// EXPO_PUBLIC_STORYBOOK_ENABLED=true로 실행했을 때만 컴포넌트 카탈로그를 보여 줍니다.
export default function StorybookRoute() {
  if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED !== 'true') return <Redirect href="/" />;
  return <StorybookUI />;
}
