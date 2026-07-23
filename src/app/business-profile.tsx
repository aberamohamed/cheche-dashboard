import { ProfileTabs, type ProfileTabId } from '@/components/business-profile/ProfileTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useBranchUsers, useOrganizationBranches } from '@/hooks/useOrganization';
import { fetchUserProfileDetails } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { Business, OrganizationBranch, User } from '@/types';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { withLoading } from '@/utils/withLoading';
import { router } from 'expo-router';
import {
  Building2,
  ChevronDown,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  User as UserIcon,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function formatRoles(roles: string[] | undefined | null): string {
  if (!Array.isArray(roles) || roles.length === 0) return '';
  return roles
    .map((role) =>
      String(role)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    )
    .join(', ');
}

function formatDisplayValue(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

type DetailField = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function DetailRow({
  label,
  value,
  icon: Icon,
  last,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  last?: boolean;
}) {
  const display = formatDisplayValue(value);
  const isEmpty = display === '—';

  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <View style={styles.detailIconWrap}>
        <Icon size={16} color={Brand.primary} strokeWidth={2.25} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, isEmpty && styles.detailValueMuted]}
        selectable
        numberOfLines={2}
      >
        {display}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Icon size={18} color={Brand.primary} strokeWidth={2.25} />
        </View>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.sectionUnderline} />
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function BranchRow({ branch }: { branch: OrganizationBranch }) {
  return (
    <View style={styles.listCard}>
      <View style={styles.listIconWrap}>
        <Building2 size={18} color={Brand.primary} />
      </View>
      <View style={styles.listBody}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {branch.name}
        </Text>
        {branch.phone ? (
          <Text style={styles.listMeta} numberOfLines={1}>
            {branch.phone}
          </Text>
        ) : null}
        {branch.address || branch.city ? (
          <Text style={styles.listMeta} numberOfLines={2}>
            {[branch.address, branch.city].filter(Boolean).join(', ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function UserRow({ user }: { user: User }) {
  return (
    <View style={styles.listCard}>
      <View style={styles.listIconWrap}>
        <Users size={18} color={Brand.primary} />
      </View>
      <View style={styles.listBody}>
        <View style={styles.userTopRow}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {user.fullName}
          </Text>
          {user.role ? (
            <View style={styles.roleBadgeSmall}>
              <Text style={styles.roleTextSmall}>{user.role}</Text>
            </View>
          ) : null}
        </View>
        {user.email ? (
          <Text style={styles.listMeta} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}
        {user.phone ? (
          <Text style={styles.listMeta} numberOfLines={1}>
            {user.phone}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function BranchSelectField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.selectWrap}>
      <Text style={styles.selectLabel}>{label}</Text>
      <Pressable style={styles.select} onPress={onPress}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={Colors.textSecondary} />
      </Pressable>
    </View>
  );
}

export default function BusinessProfileScreen() {
  const storedUser = useAuthStore((s) => s.user);
  const storedBusiness = useAuthStore((s) => s.business);
  const organizationId = useAuthStore((s) => s.organizationId);
  const setUser = useAuthStore((s) => s.setUser);
  const setBusiness = useAuthStore((s) => s.setBusiness);
  const setOrganizationId = useAuthStore((s) => s.setOrganizationId);

  const [user, setLocalUser] = useState<User | null>(storedUser);
  const [business, setLocalBusiness] = useState<Business | null>(storedBusiness);
  const [roles, setRoles] = useState<string[]>(storedUser?.role ? [storedUser.role] : []);
  const [orgName, setOrgName] = useState<string | undefined>(storedBusiness?.name);
  const [orgId, setOrgId] = useState<string | undefined>(organizationId ?? undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabId>('organization');
  const [userSearch, setUserSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>();
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);

  const branchesQuery = useOrganizationBranches(orgId);
  const usersQuery = useBranchUsers(selectedBranchId, userSearch);

  const loadProfile = useCallback(async (showModal = true) => {
    const task = async () => {
      const details = await fetchUserProfileDetails();
      const currentBusiness = useAuthStore.getState().business;

      setLocalUser(details.user);
      setRoles(Array.isArray(details.roles) ? details.roles : []);
      setOrgName(details.organizationName ?? currentBusiness?.name);
      setOrgId(details.organizationId ?? useAuthStore.getState().organizationId ?? undefined);
      setUser(details.user);

      if (details.organizationId) {
        setOrganizationId(details.organizationId);
      }

      if (details.organizationName || details.organizationId) {
        const nextBusiness: Business = {
          ...(currentBusiness ?? {
            id: details.organizationId ?? 'org',
            name: details.organizationName ?? 'Organization',
            type: 'retail',
            phone: details.user.phone,
            email: details.user.email,
            address: '',
            ownerId: details.user.id,
            createdAt: new Date().toISOString(),
          }),
          id: details.organizationId ?? currentBusiness?.id ?? 'org',
          name: details.organizationName ?? currentBusiness?.name ?? 'Organization',
          phone: currentBusiness?.phone ?? details.user.phone,
          email: currentBusiness?.email ?? details.user.email,
        };
        setLocalBusiness(nextBusiness);
        setBusiness(nextBusiness);
      }
    };

    try {
      if (showModal) {
        await withLoading(task, 'Loading profile...');
      } else {
        await task();
      }
    } catch (error) {
      appAlert('Profile Error', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  }, [setBusiness, setOrganizationId, setUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const branches = branchesQuery.data ?? [];

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId),
    [branches, selectedBranchId]
  );

  const filteredUsers = useMemo(() => {
    const items = usersQuery.data ?? [];
    const q = userSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.fullName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q)
    );
  }, [usersQuery.data, userSearch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfile(false);
      await Promise.all([
        branchesQuery.refetch(),
        selectedBranchId ? usersQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const displayUser = user ?? storedUser;
  const displayBusiness = business ?? storedBusiness;
  const initial = displayUser?.fullName?.charAt(0)?.toUpperCase() ?? 'U';
  const displayRole =
    formatDisplayValue(displayUser?.role ?? formatRoles(roles)) === '—'
      ? ''
      : displayUser?.role ?? formatRoles(roles);
  const organizationLabel = orgName ?? displayBusiness?.name ?? '';

  const accountFields: DetailField[] = [
    { label: 'Full Name', value: displayUser?.fullName ?? '', icon: UserIcon },
    { label: 'Email', value: displayUser?.email ?? '', icon: Mail },
    { label: 'Phone', value: displayUser?.phone ?? '', icon: Phone },
    { label: 'Role', value: displayRole, icon: Shield },
  ];

  const businessFields: DetailField[] = [
    { label: 'Organization', value: organizationLabel, icon: Building2 },
    { label: 'Business Phone', value: displayBusiness?.phone ?? '', icon: Phone },
    { label: 'Business Email', value: displayBusiness?.email ?? '', icon: Mail },
    { label: 'Address', value: displayBusiness?.address ?? '', icon: MapPin },
  ];

  const renderOrganizationTab = () => (
    <View style={styles.tabContent}>
      <SectionCard title="Account Details" icon={UserIcon}>
        {accountFields.map((field, index) => (
          <DetailRow
            key={field.label}
            label={field.label}
            value={field.value}
            icon={field.icon}
            last={index === accountFields.length - 1}
          />
        ))}
      </SectionCard>

      <SectionCard title="Business Information" icon={Building2}>
        {businessFields.map((field, index) => (
          <DetailRow
            key={field.label}
            label={field.label}
            value={field.value}
            icon={field.icon}
            last={index === businessFields.length - 1}
          />
        ))}
      </SectionCard>
    </View>
  );

  const renderBranchesTab = () => {
    if (branchesQuery.isLoading) {
      return (
        <View style={styles.tabContent}>
          {[1, 2, 3].map((i) => (
            <HistoryListSkeleton key={i} />
          ))}
        </View>
      );
    }

    if (branchesQuery.isError) {
      return (
        <EmptyState
          title="Could not load branches"
          message={getApiErrorMessage(branchesQuery.error)}
        />
      );
    }

    if (branches.length === 0) {
      return (
        <EmptyState
          title="No Branches"
          message="Branches for this organization will appear here"
        />
      );
    }

    return (
      <View style={styles.tabContent}>
        {branches.map((branch) => (
          <BranchRow key={branch.id} branch={branch} />
        ))}
      </View>
    );
  };

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.usersFilters}>
        <SearchBar
          value={userSearch}
          onChangeText={setUserSearch}
          placeholder="Search users by name, email, or phone..."
        />
        <BranchSelectField
          label="Branch"
          value={selectedBranch?.name}
          placeholder="Select branch"
          onPress={() => setBranchPickerOpen(true)}
        />
      </View>

      {!selectedBranchId ? (
        <EmptyState
          title="Select a branch"
          message="Choose a branch to view its users"
        />
      ) : usersQuery.isLoading ? (
        <>
          {[1, 2, 3].map((i) => (
            <HistoryListSkeleton key={i} />
          ))}
        </>
      ) : usersQuery.isError ? (
        <EmptyState
          title="Could not load users"
          message={getApiErrorMessage(usersQuery.error)}
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="No Users"
          message={
            userSearch.trim()
              ? 'No users match your search'
              : 'No users found for this branch'
          }
        />
      ) : (
        filteredUsers.map((branchUser) => <UserRow key={branchUser.id} user={branchUser} />)
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.topSection}>
        <ScreenHeader title="Business Profile" onBack={() => router.back()} />

        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.editBadge}>
              <Pencil size={11} color="#fff" strokeWidth={2.5} />
            </View>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.name} numberOfLines={2}>
              {displayUser?.fullName ?? 'User'}
            </Text>
            {organizationLabel ? (
              <Text style={styles.orgName} numberOfLines={2}>
                {organizationLabel}
              </Text>
            ) : null}
            {displayRole ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{displayRole}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {activeTab === 'organization' && renderOrganizationTab()}
        {activeTab === 'branches' && renderBranchesTab()}
        {activeTab === 'users' && renderUsersTab()}
      </ScrollView>

      <Modal visible={branchPickerOpen} onClose={() => setBranchPickerOpen(false)} title="Select Branch">
        <View style={styles.pickerList}>
          {branches.map((branch) => {
            const active = branch.id === selectedBranchId;
            return (
              <Pressable
                key={branch.id}
                style={[styles.pickerOption, active && styles.pickerOptionActive]}
                onPress={() => {
                  setSelectedBranchId(branch.id);
                  setBranchPickerOpen(false);
                }}
              >
                <Text style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}>
                  {branch.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  topSection: {
    backgroundColor: Colors.white,
  },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32, flexGrow: 1 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  avatarWrap: {
    width: 80,
    height: 80,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    lineHeight: 38,
    color: '#fff',
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.primary,
    borderWidth: 2.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-start',
  },
  name: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
  },
  orgName: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  roleBadge: {
    marginTop: 4,
    backgroundColor: Brand.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  roleText: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Shadow.iosCard,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 6,
    paddingTop: 6,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
  },
  sectionUnderline: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: Brand.primary,
  },
  sectionBody: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
  detailValueMuted: {
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadow.iosCard,
  },
  listIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: { flex: 1, gap: 3 },
  listTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
  },
  listMeta: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadgeSmall: {
    backgroundColor: Brand.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  roleTextSmall: {
    ...Typography.caption2,
    color: Brand.primary,
    fontWeight: '600',
  },
  usersFilters: {
    gap: 12,
    marginBottom: 2,
  },
  selectWrap: {
    gap: 6,
  },
  selectLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: {
    ...Typography.subhead,
    color: Colors.text,
    flex: 1,
  },
  selectPlaceholder: {
    color: Colors.textTertiary,
  },
  pickerList: {
    gap: 8,
    paddingBottom: 8,
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  pickerOptionActive: {
    backgroundColor: Brand.primaryMuted,
  },
  pickerOptionText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  pickerOptionTextActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
});
