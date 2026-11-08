import { Tabs } from 'expo-router';
import { BookOpen, Landmark, Map, Sparkles, UserRound, type LucideIcon } from 'lucide-react-native';
import type { ColorValue } from 'react-native';
import { useColors } from '@/shared/ui';

function icon(Icon: LucideIcon) {
  return function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon color={color as string} size={size} strokeWidth={1.75} />;
  };
}

export const TabsLayout = () => {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandText,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '실존', tabBarIcon: icon(Landmark), tabBarButtonTestID: 'tab-real' }}
      />
      <Tabs.Screen
        name="fantasy"
        options={{
          title: '환상',
          tabBarIcon: icon(Sparkles),
          tabBarActiveTintColor: colors.fantasyText,
          tabBarButtonTestID: 'tab-fantasy',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: '지도', tabBarIcon: icon(Map), tabBarButtonTestID: 'tab-map' }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: '기록', tabBarIcon: icon(BookOpen), tabBarButtonTestID: 'tab-records' }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: 'MY', tabBarIcon: icon(UserRound), tabBarButtonTestID: 'tab-my' }}
      />
    </Tabs>
  );
};
