import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { touchSessionActivity } from '@/utils/sessionActivity';
import { History, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface SellSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onRecentPress?: () => void;
}

export function SellSearchBar({ value, onChangeText, onRecentPress }: SellSearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Search size={18} color={Colors.textTertiary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          touchSessionActivity();
          onChangeText(text);
        }}
        placeholder="Search by name or scan barcode"
        placeholderTextColor={Colors.textTertiary}
        autoCorrect={false}
        onFocus={() => {
          touchSessionActivity();
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
      />
      <Pressable
        onPress={onRecentPress}
        hitSlop={8}
        style={({ pressed }) => [styles.recentBtn, pressed && styles.recentBtnPressed]}
      >
        <History size={16} color={Brand.primary} />
        <Text style={styles.recentLabel}>Recent</Text>
      </Pressable>
    </View>
  );
}

const SEARCH_HEIGHT = 48;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingLeft: 16,
    height: SEARCH_HEIGHT,
    gap: 10,
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: Brand.primary,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
  },
  recentBtn: {
    minWidth: 80,
    height: SEARCH_HEIGHT,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    backgroundColor: Brand.primaryMuted,
    borderTopRightRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
  },
  recentBtnPressed: {
    opacity: 0.85,
  },
  recentLabel: {
    ...Typography.caption2,
    color: Brand.primary,
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
  },
});
