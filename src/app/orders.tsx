import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { apiRequest } from '@/services/apiClient';
import { useLoadingModalStore } from '@/store/loadingModalStore';
import { appAlert } from '@/utils/alert';
import { showErrorAlert } from '@/utils/network';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ApiResponseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string;
  items: Array<{
    id: string;
    product_id: string;
    uom: string;
    description: string;
    unit_price: number;
    qty: number;
    discount_amount: number;
    amount: number;
    taxes_id: string[];
    sequence: number;
    line_number: number;
  }>;
  total_qty: number;
  total_amount: number;
  total_taxes: number;
  total_discount: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponseSummary {
  total_count: number;
  pending_count: number;
  ordered_count: number;
  received_count: number;
  paid_count: number;
  completed_count: number;
  total_value: number;
}

interface ApiResponse {
  page: number;
  page_size: number;
  data: ApiResponseOrder[];
  total: number;
  total_pages: number;
  summary: ApiResponseSummary;
}

const STATUS_OPTIONS = [
  'Draft',
  'Sent',
  'Pending',
  'Received',
  'Paid',
  'Done',
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<ApiResponseOrder[]>([]);
  const [summary, setSummary] = useState<ApiResponseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Modal State
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Load orders on mount
  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Use the standard apiRequest which handles base URL and authorization tokens
      const response = await apiRequest<ApiResponse>(
        '/purchase/orders?page=1&page_size=100&sort_by=created_at&sort_order=desc'
      );
      setOrders(response.data || []);
      setSummary(response.summary || null);
    } catch (err: any) {
      console.error('[Orders] Fetch error:', err);
      showErrorAlert(err, { fallback: 'Failed to load purchase orders.' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Summary Metrics derived either from API summary object or computed locally
  const stats = useMemo(() => {
    if (summary) {
      return {
        totalCount: summary.total_count,
        drafts: summary.total_count - summary.pending_count - summary.ordered_count - summary.received_count - summary.paid_count - summary.completed_count, // draft is fallback rest
        sent: summary.ordered_count,
        pending: summary.pending_count,
        stocked: summary.received_count,
        paid: summary.paid_count,
        done: summary.completed_count,
        totalValue: summary.total_value,
      };
    }

    // Fallback counts computed locally
    const totalCount = orders.length;
    const drafts = orders.filter((o) => o.status?.toLowerCase() === 'draft').length;
    const sent = orders.filter((o) => o.status?.toLowerCase() === 'sent').length;
    const pending = orders.filter((o) => o.status?.toLowerCase() === 'pending').length;
    const stocked = orders.filter((o) => o.status?.toLowerCase() === 'received').length;
    const paid = orders.filter((o) => o.status?.toLowerCase() === 'paid').length;
    const done = orders.filter((o) => o.status?.toLowerCase() === 'done' || o.status?.toLowerCase() === 'completed').length;
    const totalValue = orders.reduce((sum, o) => sum + (o.grand_total || o.total_amount || 0), 0);

    return { totalCount, drafts, sent, pending, stocked, paid, done, totalValue };
  }, [orders, summary]);

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusLower = o.status?.toLowerCase();

      // Status Filter from Stat Cards
      if (activeStatusFilter && activeStatusFilter !== 'ALL') {
        if (activeStatusFilter === 'DRAFTS' && statusLower !== 'draft') {
          return false;
        } else if (activeStatusFilter === 'SENT' && statusLower !== 'sent') {
          return false;
        } else if (activeStatusFilter === 'PENDING' && statusLower !== 'pending') {
          return false;
        } else if (activeStatusFilter === 'STOCKED' && statusLower !== 'received') {
          return false;
        } else if (activeStatusFilter === 'SETTLED' && statusLower !== 'paid') {
          return false;
        } else if (activeStatusFilter === 'DONE' && statusLower !== 'done' && statusLower !== 'completed') {
          return false;
        }
      }

      // Search Query
      const q = search.trim().toLowerCase();
      if (q.length > 0) {
        return (
          o.po_number?.toLowerCase().includes(q) ||
          o.supplier_name?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [orders, search, activeStatusFilter]);

  // Action: Approve & Receive — themed confirmation modal (not native alert) + loading modal.
  const handleApproveReceive = (id: string) => {
    appAlert(
      'Approve & Receive',
      'Are you sure you want to approve and receive this purchase order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Receive',
          onPress: async () => {
            const { show, hide } = useLoadingModalStore.getState();
            try {
              setApprovingOrderId(id);
              show('Approving order...');
              await apiRequest(`/purchase/orders/${id}/approve-and-receive`, {
                method: 'POST',
              });
              await fetchOrders(false);
            } catch (err) {
              console.warn('[Orders] Approve failed:', err);
              showErrorAlert(err, { fallback: 'Failed to approve the purchase order.' });
            } finally {
              hide();
              setApprovingOrderId(null);
            }
          },
        },
      ],
      { variant: 'warning' }
    );
  };

  // Action: Edit Order — open the create/edit form prefilled with this order.
  const handleEditOrder = (order: ApiResponseOrder) => {
    router.push({ pathname: '/create-order', params: { order: JSON.stringify(order) } });
  };

  // Action: Delete Order — themed confirmation modal (not native alert), then DELETE.
  const handleDeleteOrder = (id: string, poNumber: string) => {
    appAlert(
      'Delete Order',
      `Are you sure you want to delete ${poNumber}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { show, hide } = useLoadingModalStore.getState();
            try {
              setDeletingOrderId(id);
              show('Deleting order...');
              await apiRequest(`/purchase/orders/${id}`, { method: 'DELETE' });
              await fetchOrders(false);
            } catch (err) {
              console.warn('[Orders] API Delete failed:', err);
              showErrorAlert(err, { fallback: 'Failed to delete purchase order.' });
            } finally {
              hide();
              setDeletingOrderId(null);
            }
          },
        },
      ],
      { variant: 'warning' }
    );
  };



  const toggleStatusFilter = (filterKey: string) => {
    if (activeStatusFilter === filterKey) {
      setActiveStatusFilter(null);
    } else {
      setActiveStatusFilter(filterKey);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'pending':
        return { bg: Colors.warningBg, text: Colors.warning };
      case 'received':
      case 'done':
      case 'completed':
        return { bg: Colors.successBg, text: Colors.success };
      case 'draft':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'sent':
        return { bg: '#EFF6FF', text: '#2563EB' };
      default:
        return { bg: Colors.borderLight, text: Colors.textSecondary };
    }
  };

  const formatCurrencyValue = (val: number) => {
    return `ETB ${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MM/dd/yyyy');
    } catch {
      return dateString;
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ScreenHeader title="Purchase Orders" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={styles.loadingText}>Loading purchase orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Purchase Orders"
        onBack={() => router.back()}
        right={
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => setReportModalVisible(true)}
              hitSlop={8}
            >
              <Ionicons name="bar-chart-outline" size={22} color={Brand.primary} />
            </Pressable>
            <View style={styles.headerDivider} />
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => router.push('/create-order')}
              hitSlop={8}
            >
              <Ionicons name="add-outline" size={24} color={Brand.primary} />
            </Pressable>
          </View>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by PO number or supplier..."
        />
      </View>



      {/* Active Filter Hint */}
      {activeStatusFilter && (
        <View style={styles.filterChipRow}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>
              Filtered: {activeStatusFilter}
            </Text>
            <Pressable
              onPress={() => setActiveStatusFilter(null)}
              style={styles.filterChipClose}
            >
              <Ionicons name="close-circle" size={16} color={Brand.primary} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Main List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Brand.primary]}
            tintColor={Brand.primary}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingTop: 4,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            title="No Purchase Orders"
            message={
              search.length > 0
                ? 'No matching orders found'
                : 'Your purchase orders will appear here'
            }
          />
        }
        renderItem={({ item }) => {
          const badge = getStatusBadgeStyle(item.status);
          const orderDateFormatted = formatDisplayDate(item.order_date);
          const deliveryDateFormatted = formatDisplayDate(item.expected_delivery_date);
          const statusDisplay = (item.status || '').toUpperCase();

          return (
            <View style={styles.orderCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardPoNumber}>{item.po_number || 'No PO Number'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                    {statusDisplay}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Body */}
              <View style={styles.cardBody}>
                {/* Supplier */}
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={15} color={Colors.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    Supplier: <Text style={styles.boldText}>{item.supplier_name || 'N/A'}</Text>
                  </Text>
                </View>

                {/* Dates */}
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    Ordered: {orderDateFormatted} · Delivery: {deliveryDateFormatted}
                  </Text>
                </View>

                {/* Quantity */}
                <View style={styles.detailRow}>
                  <Ionicons name="cube-outline" size={15} color={Colors.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    Quantity: <Text style={styles.boldText}>{(item.total_qty || 0).toLocaleString()}</Text>
                  </Text>
                </View>

                {/* Amount */}
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={15} color={Colors.textSecondary} style={styles.detailIcon} />
                  <Text style={[styles.detailText, styles.amountText]}>
                    Amount: {formatCurrencyValue(item.grand_total || item.total_amount || 0)}
                  </Text>
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.footerLeftActions}>
                  {statusDisplay === 'PENDING' && (
                   <Pressable
                   style={[
                     styles.approveBtn,
                     approvingOrderId === item.id && { opacity: 0.8 },
                   ]}
                   disabled={approvingOrderId === item.id}
                   onPress={() => handleApproveReceive(item.id)}
                 >
                   {approvingOrderId === item.id ? (
                     <ActivityIndicator size="small" color={Colors.white} />
                   ) : (
                     <Text style={styles.approveBtnText}>Approve & Receive</Text>
                   )}
                 </Pressable>
                  )}
                </View>

                <View style={styles.footerRightIcons}>
                  <Pressable
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEditOrder(item)}
                  >
                    <Ionicons name="create-outline" size={16} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.deleteBtn, deletingOrderId === item.id && { opacity: 0.7 }]}
                    disabled={deletingOrderId === item.id}
                    onPress={() => handleDeleteOrder(item.id, item.po_number)}
                  >
                    {deletingOrderId === item.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={16} color={Colors.white} />
                        <Text style={styles.actionBtnText}>Delete</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Report Summary Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.reportModalTitleRow}>
                <View style={styles.reportModalTitleIcon}>
                  <Ionicons name="bar-chart-outline" size={18} color={Brand.primary} />
                </View>
                <Text style={styles.modalTitle}>Orders Report</Text>
              </View>
              <Pressable
                onPress={() => setReportModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.reportScrollContent}>
              {/* 2-column grid of stat cards */}
              <View style={styles.reportGrid}>

                {/* Total Orders */}
                <View style={[styles.reportCard, { borderLeftColor: Brand.primary }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: '#FDF2F8' }]}>
                    <Ionicons name="list" size={20} color={Brand.primary} />
                  </View>
                  <Text style={styles.reportCardValue}>{stats.totalCount}</Text>
                  <Text style={styles.reportCardLabel}>Total Orders</Text>
                  <Text style={[styles.reportCardBadge, { color: Brand.primary, backgroundColor: Brand.primaryMuted }]}>ALL</Text>
                </View>

                {/* Total Value */}
                <View style={[styles.reportCard, { borderLeftColor: '#EC4899' }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: '#FDF2F8' }]}>
                    <Ionicons name="wallet-outline" size={20} color="#EC4899" />
                  </View>
                  <Text style={[styles.reportCardValue, { fontSize: 13 }]} numberOfLines={2}>
                    {formatCurrencyValue(stats.totalValue)}
                  </Text>
                  <Text style={styles.reportCardLabel}>Total Value</Text>
                  <Text style={[styles.reportCardBadge, { color: '#BE185D', backgroundColor: '#FDF2F8' }]}>TOTAL</Text>
                </View>

                {/* Pending */}
                <View style={[styles.reportCard, { borderLeftColor: Colors.warning }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: Colors.warningBg }]}>
                    <Ionicons name="time-outline" size={20} color={Colors.warning} />
                  </View>
                  <Text style={styles.reportCardValue}>{stats.pending}</Text>
                  <Text style={styles.reportCardLabel}>Waiting Approval</Text>
                  <Text style={[styles.reportCardBadge, { color: Colors.warning, backgroundColor: Colors.warningBg }]}>PENDING</Text>
                </View>

                {/* Ordered / Sent */}
                <View style={[styles.reportCard, { borderLeftColor: '#2563EB' }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="trending-up" size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.reportCardValue}>{stats.sent}</Text>
                  <Text style={styles.reportCardLabel}>Ordered / Sent</Text>
                  <Text style={[styles.reportCardBadge, { color: '#2563EB', backgroundColor: '#EFF6FF' }]}>SENT</Text>
                </View>

                {/* Received / Stocked */}
                <View style={[styles.reportCard, { borderLeftColor: Colors.success }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: Colors.successBg }]}>
                    <Ionicons name="cube-outline" size={20} color={Colors.success} />
                  </View>
                  <Text style={styles.reportCardValue}>{stats.stocked}</Text>
                  <Text style={styles.reportCardLabel}>Received / Stocked</Text>
                  <Text style={[styles.reportCardBadge, { color: Colors.success, backgroundColor: Colors.successBg }]}>STOCKED</Text>
                </View>

                {/* Paid */}
                <View style={[styles.reportCard, { borderLeftColor: '#0EA5E9' }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: '#F0F9FF' }]}>
                    <Ionicons name="cash-outline" size={20} color="#0EA5E9" />
                  </View>
                  <Text style={styles.reportCardValue}>{stats.paid}</Text>
                  <Text style={styles.reportCardLabel}>Paid Orders</Text>
                  <Text style={[styles.reportCardBadge, { color: '#0369A1', backgroundColor: '#E0F2FE' }]}>SETTLED</Text>
                </View>

                {/* Completed */}
                <View style={[styles.reportCard, { borderLeftColor: '#7C3AED' }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.reportCardValue}>{stats.done}</Text>
                  <Text style={styles.reportCardLabel}>Fully Completed</Text>
                  <Text style={[styles.reportCardBadge, { color: '#7C3AED', backgroundColor: '#EDE9FE' }]}>DONE</Text>
                </View>

                {/* Drafts */}
                <View style={[styles.reportCard, { borderLeftColor: '#6B7280' }]}>
                  <View style={[styles.reportIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="document-outline" size={20} color="#6B7280" />
                  </View>
                  <Text style={styles.reportCardValue}>{stats.drafts}</Text>
                  <Text style={styles.reportCardLabel}>Draft Orders</Text>
                  <Text style={[styles.reportCardBadge, { color: '#6B7280', backgroundColor: '#F3F4F6' }]}>DRAFTS</Text>
                </View>

              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loadingScreen: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  filterChipRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.white,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.primaryMuted,
    borderColor: Brand.primary,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.primary,
  },
  filterChipClose: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { flex: 1, backgroundColor: Colors.background },
  orderCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.iosCard,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPoNumber: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  cardBody: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 20,
    marginRight: 6,
  },
  detailText: {
    ...Typography.subhead,
    color: Colors.text,
    fontSize: 13,
  },
  boldText: {
    fontWeight: '600',
  },
  amountText: {
    fontWeight: '700',
    color: Brand.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
  },
  footerLeftActions: {
    flex: 1,
  },
  footerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    minWidth: 84,
  },
  editBtn: { backgroundColor: '#2563EB' },
  deleteBtn: { backgroundColor: Colors.danger },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  approveBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  actionIconBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
  modalCloseBtn: {
    padding: 2,
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  pickerSection: {
    gap: 6,
    marginBottom: 6,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  statusChipSelected: {
    backgroundColor: Brand.primaryMuted,
    borderColor: Brand.primary,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  statusChipTextSelected: {
    color: Brand.primary,
    fontWeight: '700',
  },
  createBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: Radius.md,
  },
  // Report Modal
  reportModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportModalTitleIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: 14,
    gap: 4,
    ...Shadow.iosCard,
  },
  reportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  reportCardValue: {
    ...Typography.title2,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
  },
  reportCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  reportCardBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
});
