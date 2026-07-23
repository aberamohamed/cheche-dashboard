import { Brand, Colors, Typography } from '@/constants/theme';
import { StyleSheet, Switch, Text, View } from 'react-native';

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingToggle({ label, description, value, onValueChange }: SettingToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Brand.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  textWrap: { flex: 1, gap: 2 },
  label: { ...Typography.body, color: Colors.text },
  description: { ...Typography.caption1, color: Colors.textSecondary },
});
