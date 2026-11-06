import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, XStack, YStack } from 'tamagui';
import { useSessionStore } from '@/entities/session';
import { backend } from '@/shared/api';
import { AppText, Divider, Touchable } from '@/shared/ui';

const MenuItem = ({
  label,
  onPress,
  small,
  testID,
}: {
  label: string;
  onPress: () => void;
  small?: boolean;
  testID?: string;
}) => (
  <Touchable
    testID={testID}
    onPress={onPress}
    accessibilityLabel={label}
    justifyContent="center"
    paddingHorizontal={28}
    paddingVertical={small ? 10 : 14}
  >
    <AppText size={small ? 'body' : 'row'}>{label}</AppText>
  </Touchable>
);

export const AppDrawer = ({ onNavigate }: { onNavigate: () => void }) => {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const email = useSessionStore((state) => state.session?.email);

  const go = (href: '/places' | '/records' | '/search' | '/account' | '/checklist' | '/stats') => {
    onNavigate();
    router.push(href);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <YStack paddingTop={top + 24} paddingBottom={32}>
        <Touchable
          testID="drawer-account"
          onPress={() => go('/account')}
          accessibilityLabel={`MY 페이지, ${email ?? ''}`}
          paddingHorizontal={28}
          paddingBottom={20}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack flex={1} gap={4}>
              <AppText size="headline">낚고먹고</AppText>
              <AppText size="caption" tone="muted" numberOfLines={1}>
                {email}
              </AppText>
            </YStack>
            <ChevronRight size={20} color="#5f6673" strokeWidth={1.75} />
          </XStack>
        </Touchable>
        {backend.mode === 'demo' ? (
          <View
            backgroundColor="brandSoft"
            paddingHorizontal={28}
            paddingVertical={12}
            marginBottom={12}
          >
            <AppText size="caption" tone="ink">
              데모 모드: 가상 데이터로 동작하며 앱을 끄면 초기화됩니다.
            </AppText>
          </View>
        ) : null}
        <MenuItem testID="drawer-places" label="내 장소" onPress={() => go('/places')} />
        <MenuItem testID="drawer-records" label="전체 기록" onPress={() => go('/records')} />
        <MenuItem testID="drawer-search" label="장소 검색" onPress={() => go('/search')} />
        <MenuItem
          testID="drawer-checklist"
          label="출조 체크리스트"
          onPress={() => go('/checklist')}
        />
        <MenuItem testID="drawer-stats" label="통계" onPress={() => go('/stats')} />
        <View marginVertical={12}>
          <Divider inset={28} />
        </View>
        <MenuItem small label="MY 페이지" onPress={() => go('/account')} />
      </YStack>
    </ScrollView>
  );
};
