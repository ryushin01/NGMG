import type { LucideIcon } from 'lucide-react-native';
import { useColors, type ColorName } from './colors';

type AppIconProps = {
  icon: LucideIcon;
  color: ColorName;
  fill?: ColorName;
  size?: number;
  strokeWidth?: number;
};

/** 화면 모드를 따르는 아이콘 */
export const AppIcon = ({ icon: Icon, color, fill, size, strokeWidth }: AppIconProps) => {
  const colors = useColors();
  return (
    <Icon
      color={colors[color]}
      fill={fill ? colors[fill] : 'none'}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
};
