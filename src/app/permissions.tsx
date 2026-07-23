import { SettingToggle } from '@/components/settings/SettingToggle';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function PermissionsScreen() {
  const settings = useSettingsStore();
  const update = useSettingsStore((s) => s.updateSetting);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Permissions" onBack={() => router.back()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Notifications" />
        <View style={styles.section}>
          <SettingToggle
            label="Push Notifications"
            description="Receive alerts on this device"
            value={settings.pushNotifications}
            onValueChange={(v) => update('pushNotifications', v)}
          />
          <SettingToggle
            label="Low Stock Alerts"
            description="Notify when products run low"
            value={settings.lowStockAlerts}
            onValueChange={(v) => update('lowStockAlerts', v)}
          />
          <SettingToggle
            label="Sales Reports"
            description="Daily summary notifications"
            value={settings.salesReports}
            onValueChange={(v) => update('salesReports', v)}
          />
         
        </View>

        <SectionTitle title="Device Access" />
        <View style={styles.section}>
          <SettingToggle
            label="Camera Access"
            description="Required for barcode scanning"
            value={settings.cameraAccess}
            onValueChange={(v) => update('cameraAccess', v)}
          />
          <SettingToggle
            label="Bluetooth Printer"
            description="Connect to receipt printers"
            value={settings.bluetoothPrinter}
            onValueChange={(v) => update('bluetoothPrinter', v)}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  sectionTitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  section: { backgroundColor: Colors.white },
});
