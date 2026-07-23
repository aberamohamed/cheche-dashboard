import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { touchSessionActivity } from '@/utils/sessionActivity';
import { ListFilter, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterActive?: boolean;
  readOnly?: boolean;
  onPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search products',
  onFilterPress,
  filterActive = false,
  readOnly = false,
  onPress,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const showClear = value.length > 0 && !readOnly;
  const showFilter = Boolean(onFilterPress);

  const input = (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={(text) => {
        touchSessionActivity();
        onChangeText(text);
      }}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      autoCorrect={false}
      autoFocus={false}
      editable={!readOnly}
      onFocus={() => {
        if (readOnly) return;
        touchSessionActivity();
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
    />
  );

  return (
    <View
      style={[
        styles.container,
        focused && styles.containerFocused,
        showFilter && styles.containerWithFilter,
      ]}
    >
      <Search size={18} color={Colors.textTertiary} />
      {readOnly ? (
        <Pressable style={styles.inputPressable} onPress={onPress}>
          {input}
        </Pressable>
      ) : (
        input
      )}
      {showClear ? (
        <Pressable
          onPress={() => {
            touchSessionActivity();
            onChangeText('');
          }}
          hitSlop={8}
          style={styles.clearBtn}
        >
          <X size={18} color={Colors.textTertiary} />
        </Pressable>
      ) : null}
      {showFilter ? (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={() => {
              touchSessionActivity();
              onFilterPress?.();
            }}
            hitSlop={6}
            style={[styles.filterBtn, filterActive && styles.filterBtnActive]}
          >
            <ListFilter size={18} color={Brand.primary} />
            {filterActive ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerWithFilter: {
    paddingRight: 8,
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
  inputPressable: {
    flex: 1,
  },
  clearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: Colors.border,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Brand.primaryMuted,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.primary,
  },
});
