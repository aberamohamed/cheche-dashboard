import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const ICON_SIZE = 18;

type AuthInputIconProps = {
  name: keyof typeof Ionicons.glyphMap;
};

export function AuthInputIcon({ name }: AuthInputIconProps) {
  return <Ionicons name={name} size={ICON_SIZE} color={Colors.textSecondary} />;
}
