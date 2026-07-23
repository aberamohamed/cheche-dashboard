import type { ReactNode } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type StandardTabBarButtonProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  accessibilityRole?: PressableProps['accessibilityRole'];
  accessibilityState?: PressableProps['accessibilityState'];
  accessibilityLabel?: string;
  testID?: string;
  href?: string;
};

/** Minimal tab button — no custom ripple for faster tab switches on Android. */
export function StandardTabBarButton({
  children,
  style,
  href: _href,
  onPress,
  onLongPress,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  testID,
}: StandardTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress ?? undefined}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      {children}
    </Pressable>
  );
}
