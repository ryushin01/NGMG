import {
  Footprints,
  Globe,
  Lock,
  Medal,
  Route,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { View, YStack } from 'tamagui';
import { AppIcon, AppText } from '@/shared/ui';
import type { BadgeIcon, BadgeStatus } from '../model/badges';

const ICONS: Record<BadgeIcon, LucideIcon> = {
  footprints: Footprints,
  medal: Medal,
  sparkles: Sparkles,
  globe: Globe,
  route: Route,
};

/** 획득한 뱃지는 색과 날짜로, 아직이면 자물쇠와 진행도(3/5)로 보여 줍니다. 색에만 의존하지 않습니다. */
export const BadgeMedal = ({ status, size = 72 }: { status: BadgeStatus; size?: number }) => {
  const { badge, earned, current, target, earnedAt } = status;
  const fantasy = badge.icon === 'sparkles';
  return (
    <YStack
      testID={`badge-${badge.id}`}
      width={size + 32}
      alignItems="center"
      gap={6}
      accessible
      accessibilityLabel={`${badge.name}, ${
        earned ? `획득, ${earnedAt?.slice(0, 10)}` : `미획득, ${current}/${target}`
      }, ${badge.description}`}
    >
      <View
        width={size}
        height={size}
        borderRadius={size / 2}
        alignItems="center"
        justifyContent="center"
        borderWidth={earned ? 3 : 2}
        borderStyle={earned ? 'solid' : 'dashed'}
        borderColor={earned ? (fantasy ? 'fantasyText' : 'brandText') : 'muted'}
        backgroundColor={earned ? (fantasy ? 'fantasySoft' : 'brandSoft') : 'surfaceMuted'}
      >
        <AppIcon
          icon={earned ? ICONS[badge.icon] : Lock}
          size={size * 0.42}
          color={earned ? (fantasy ? 'fantasyText' : 'brandText') : 'muted'}
          strokeWidth={1.75}
        />
      </View>
      <AppText size="caption" tone="ink" bold textAlign="center" numberOfLines={2}>
        {badge.name}
      </AppText>
      <AppText size="caption" tone="muted" textAlign="center">
        {earned ? `${earnedAt?.slice(0, 10).replaceAll('-', '. ')}.` : `${current}/${target}`}
      </AppText>
    </YStack>
  );
};
