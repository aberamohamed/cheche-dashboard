import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface OnboardingStepActionsProps {
  onPrevious?: () => void;
  onContinue?: () => void;
  continueTitle?: string;
  previousTitle?: string;
  loading?: boolean;
  disabled?: boolean;
  showContinue?: boolean;
  showPrevious?: boolean;
}

export function OnboardingStepActions({
  onPrevious,
  onContinue,
  continueTitle = 'Continue',
  previousTitle = 'Previous',
  loading = false,
  disabled = false,
  showContinue = true,
  showPrevious = true,
}: OnboardingStepActionsProps) {
  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrevious?.();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinue?.();
  };

  return (
    <View
      style={[
        styles.row,
        !showContinue && styles.rowPreviousOnly,
        !showPrevious && showContinue && styles.rowContinueOnly,
      ]}
    >
      {showPrevious ? (
        <Pressable
          style={({ pressed }) => [
            styles.previousButton,
            loading && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed,
          ]}
          onPress={handlePrevious}
          disabled={loading}
          accessibilityRole="button"
        >
          <ChevronLeft size={20} color={Brand.primary} strokeWidth={2.5} />
          <Text style={styles.previousButtonText}>{previousTitle}</Text>
        </Pressable>
      ) : null}

      {showContinue ? (
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            (disabled || loading) && styles.buttonDisabled,
            pressed && !disabled && !loading && styles.buttonPressed,
          ]}
          onPress={handleContinue}
          disabled={disabled || loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.continueButtonText}>{continueTitle}</Text>
              <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    gap: 12,
  },
  rowPreviousOnly: {
    justifyContent: 'flex-start',
  },
  rowContinueOnly: {
    justifyContent: 'stretch',
  },
  previousButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Brand.primary,
  },
  previousButtonText: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
  },
  continueButtonText: {
    ...Typography.subhead,
    color: Colors.white,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.92,
  },
});
