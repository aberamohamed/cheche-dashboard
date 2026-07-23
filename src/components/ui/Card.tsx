import { Colors, Radius, Shadow } from '@/constants/theme';
import { StyleSheet, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  padding?: number;
}

export function Card({ children, style, padding = 16, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
});
