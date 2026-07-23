import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { Building2 } from 'lucide-react-native';
import {
  EtradeApiError,
  fetchEtradeBusinessByLicenseNo,
} from '@/services/etradeService';
import type { EtradeBusinessByLicenseDetail, EtradeRegistrationInfo } from '@/types/etrade';
import { buildEtradePreviewTableRows, getPrimaryEtradeBusiness } from '@/utils/etrade';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface EtradeRegistrationPreviewProps {
  data: EtradeRegistrationInfo;
  initialDetail?: EtradeBusinessByLicenseDetail | null;
  onDetailLoaded?: (detail: EtradeBusinessByLicenseDetail) => void;
}

function TableRowItem({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast: boolean;
}) {
  return (
    <View style={[styles.tableRow, !isLast && styles.tableRowBorder]}>
      <Text style={styles.tableLabel}>{label}</Text>
      <View style={styles.tableColumnDivider} />
      <Text style={styles.tableValue}>{value}</Text>
    </View>
  );
}

export function EtradeRegistrationPreview({
  data,
  initialDetail = null,
  onDetailLoaded,
}: EtradeRegistrationPreviewProps) {
  const [detail, setDetail] = useState<EtradeBusinessByLicenseDetail | null>(initialDetail);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const primaryBusiness = getPrimaryEtradeBusiness(data);
  const licenseNo =
    primaryBusiness?.LicenceNumber?.trim() || data.LicenseNo?.trim() || '';
  const tin = data.Tin?.trim() || '';
  const rows = buildEtradePreviewTableRows(data, detail);
  const showViewAll = !detail && !!licenseNo && !!tin;

  const handleViewAll = async () => {
    if (!licenseNo || !tin || loadingDetail) return;

    setLoadingDetail(true);
    setDetailError(null);
    try {
      const result = await fetchEtradeBusinessByLicenseNo({
        licenseNo,
        tin,
        lang: 'en',
      });
      setDetail(result);
      onDetailLoaded?.(result);
    } catch (err) {
      const message =
        err instanceof EtradeApiError
          ? err.message
          : 'Could not load full business details. Try again.';
      setDetailError(message);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultTopRow}>
            <View style={styles.iconWrap}>
              <Building2 size={16} color={Brand.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ETRADE</Text>
            </View>
          </View>
          <Text style={styles.resultSubtitle}>
            Review the details below before continuing onboarding.
          </Text>
        </View>
      </View>

      <View style={styles.tableCard}>
        {rows.map((row, index) => (
          <TableRowItem
            key={row.label}
            label={row.label}
            value={row.value}
            isLast={index === rows.length - 1 && !showViewAll}
          />
        ))}

        {showViewAll ? (
          <View style={styles.viewAllWrap}>
            {detailError ? <Text style={styles.detailError}>{detailError}</Text> : null}
            <Pressable
              onPress={handleViewAll}
              disabled={loadingDetail}
              style={({ pressed }) => [
                styles.viewAllButton,
                loadingDetail && styles.viewAllButtonDisabled,
                pressed && !loadingDetail && styles.viewAllButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="View all business details"
            >
              {loadingDetail ? (
                <ActivityIndicator color={Brand.primary} />
              ) : (
                <Text style={styles.viewAllButtonText}>View All</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  resultHeader: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Brand.primaryMuted,
  },
  badgeText: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultSubtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tableCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.white,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    width: 118,
    flexShrink: 0,
    lineHeight: 18,
    paddingTop: 1,
  },
  tableColumnDivider: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: 'stretch',
    marginVertical: -2,
  },
  tableValue: {
    ...Typography.caption1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
    textAlign: 'right',
  },
  viewAllWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  viewAllButton: {
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButtonDisabled: {
    opacity: 0.7,
  },
  viewAllButtonPressed: {
    opacity: 0.92,
  },
  viewAllButtonText: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  detailError: {
    ...Typography.caption1,
    color: Colors.danger,
    textAlign: 'center',
  },
});
