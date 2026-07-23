import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { Check, Hash, Search, Shield } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface EtradeTinSearchStepProps {
  tin: string;
  loading: boolean;
  error: string | null;
  onChangeTin: (value: string) => void;
  onSearch: () => void;
  canSearch: boolean;
}

export function EtradeTinSearchStep({
  tin,
  loading,
  error,
  onChangeTin,
  onSearch,
  canSearch,
}: EtradeTinSearchStepProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.securityCard}>
        <View style={styles.securityIconWrap}>
          <Shield size={22} color={Brand.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.securityText}>
          <Text style={styles.securityTitle}>Your information is secure</Text>
          <Text style={styles.securitySubtitle}>
            We use eTrade to verify your business license details.
          </Text>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>TIN (10 digits)</Text>
        <View style={styles.inputShell}>
          <View style={styles.hashIconWrap}>
            <Hash size={16} color={Colors.white} strokeWidth={2.5} />
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={tin}
              onChangeText={onChangeTin}
              placeholder="1111111111"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
              maxLength={10}
              editable={!loading}
              returnKeyType="search"
              onSubmitEditing={onSearch}
            />
          </View>
          <Pressable
            onPress={onSearch}
            disabled={!canSearch}
            style={({ pressed }) => [
              styles.searchIconButton,
              !canSearch && styles.searchIconButtonDisabled,
              pressed && canSearch && styles.searchIconButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search TIN on eTrade"
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Search size={18} color={Colors.white} strokeWidth={2.5} />
            )}
          </Pressable>
        </View>

        <View style={styles.helperRow}>
          <Check size={14} color={Brand.primary} strokeWidth={2.5} />
          <Text style={styles.helperText}>
            Enter the 10-digit TIN number without spaces or special characters.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primaryMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(227, 0, 116, 0.1)',
  },
  securityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(227, 0, 116, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  securityText: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  securityTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  securitySubtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  fieldBlock: {
    gap: 10,
  },
  fieldLabel: {
    ...Typography.caption1,
    color: Colors.text,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    backgroundColor: Colors.white,
  },
  hashIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    paddingVertical: 0,
    minHeight: 36,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  searchIconButtonDisabled: {
    backgroundColor: 'rgba(120,120,128,0.2)',
  },
  searchIconButtonPressed: {
    opacity: 0.92,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  helperText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.danger,
    paddingHorizontal: 2,
  },
});
