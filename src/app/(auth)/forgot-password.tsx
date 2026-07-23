import { Button } from '@/components/ui/Button';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import {
  SCREEN_HEADER_PADDING_TOP,
  SCREEN_HEADER_SIDE_SIZE,
} from '@/constants/screenHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  forgotPasswordPhoneSchema,
  type ForgotPasswordPhoneForm,
} from '@/features/auth/schemas';
import { resetPassword, sendOtp } from '@/services/authService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { formatPhoneForApi } from '@/utils/phone';
import { withLoading } from '@/utils/withLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, CheckCircle2, Clock3, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OTP_LENGTH = 5;
const RESEND_SECONDS = 60;

type Step = 1 | 2 | 3 | 4;

function formatDisplayPhone(phone: string): string {
  const local = phone.replace(/\D/g, '').slice(-9);
  return local ? `+251 ${local}` : phone;
}

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string }>();
  const initialPhone = typeof params.phone === 'string' ? params.phone : '';

  const [step, setStep] = useState<Step>(initialPhone ? 2 : 1);
  const [phone, setPhone] = useState(initialPhone);
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [otpFocusedIndex, setOtpFocusedIndex] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSubStep, setPasswordSubStep] = useState<'input' | 'confirm'>('input');

  const otp = otpDigits.join('');
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const autoSentRef = useRef(false);

  const phoneForm = useForm<ForgotPasswordPhoneForm>({
    resolver: zodResolver(forgotPasswordPhoneSchema),
    defaultValues: { phone: initialPhone },
  });

  const animateToStep = useCallback(
    (next: Step) => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -32, duration: 160, useNativeDriver: true }),
      ]).start(() => {
        setStep(next);
        slideAnim.setValue(32);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim]
  );

  const sendOtpCode = useCallback(async (localPhone: string) => {
    await withLoading(async () => {
      await sendOtp(formatPhoneForApi(localPhone));
    }, 'Sending OTP...');
    setPhone(localPhone);
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    setResendTimer(RESEND_SECONDS);
  }, []);

  useEffect(() => {
    if (!initialPhone || autoSentRef.current) return;
    autoSentRef.current = true;
    void sendOtpCode(initialPhone).catch((error) => {
      appAlert('Could Not Send OTP', getApiErrorMessage(error), undefined, { variant: 'error' });
      setStep(1);
    });
  }, [initialPhone, sendOtpCode]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  useEffect(() => {
    if (step !== 2) return;
    const filled = otpDigits.findIndex((d) => !d);
    const focusIndex = filled === -1 ? 0 : filled;
    setOtpFocusedIndex(focusIndex);
    const timer = setTimeout(() => {
      otpRefs.current[focusIndex]?.focus();
    }, 280);
    return () => clearTimeout(timer);
  }, [step]);

  const handleOtpChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setOtpError('');

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, OTP_LENGTH).split('');
      const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '');
      setOtpDigits(next);
      const focusAt = Math.min(pasted.length, OTP_LENGTH - 1);
      requestAnimationFrame(() => otpRefs.current[focusAt]?.focus());
      return;
    }

    const digit = cleaned.slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      requestAnimationFrame(() => otpRefs.current[index + 1]?.focus());
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') return;
    if (otpDigits[index]) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }
    if (index > 0) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      otpRefs.current[index - 1]?.focus();
    }
  };

  const isLengthValid = newPassword.length >= 6;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isComplexityValid = hasLetter && hasNumber;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const passwordStrength = useMemo(() => {
    if (!newPassword.length) return { score: 0, label: 'Enter password', color: '#CBD5E1' };
    let score = 0;
    if (newPassword.length >= 4) score += 1;
    if (isLengthValid) score += 1;
    if (hasLetter) score += 1;
    if (hasNumber) score += 1;
    if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
    if (score === 2) return { score, label: 'Fair', color: '#F59E0B' };
    if (score === 3) return { score, label: 'Good', color: '#22C55E' };
    return { score, label: 'Strong', color: '#10B981' };
  }, [newPassword, isLengthValid, hasLetter, hasNumber]);

  const shouldShowConfirmInput =
    passwordSubStep === 'confirm' || (isLengthValid && isComplexityValid);

  useEffect(() => {
    const valid = isLengthValid && isComplexityValid;
    if (valid && passwordSubStep !== 'confirm') {
      setPasswordSubStep('confirm');
      return;
    }
    if (!valid && passwordSubStep === 'confirm') {
      setPasswordSubStep('input');
      setConfirmPassword('');
    }
  }, [isLengthValid, isComplexityValid, passwordSubStep]);

  const onSendPhoneOtp = async (data: ForgotPasswordPhoneForm) => {
    try {
      await sendOtpCode(data.phone);
      animateToStep(2);
    } catch (error) {
      appAlert('Could Not Send OTP', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const resendOtp = async () => {
    if (!phone || resendTimer > 0) return;
    try {
      await sendOtpCode(phone);
    } catch (error) {
      appAlert('Could Not Send OTP', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const goToPasswordStep = () => {
    if (otp.trim().length < OTP_LENGTH) {
      setOtpError('Enter the OTP sent to your phone');
      return;
    }
    setOtpError('');
    animateToStep(3);
  };

  const onResetPassword = async () => {
    setPasswordError('');
    if (!isLengthValid || !isComplexityValid) {
      setPasswordError('Use at least 6 characters with letters and numbers.');
      return;
    }
    if (confirmPassword.length < 6) {
      setPasswordError('Please confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please try again.');
      return;
    }

    try {
      await withLoading(async () => {
        await resetPassword(formatPhoneForApi(phone), otp.trim(), newPassword);
      }, 'Resetting password...');
      animateToStep(4);
    } catch (error) {
      setPasswordError(getApiErrorMessage(error));
    }
  };

  const goBack = () => {
    if (step === 3 && shouldShowConfirmInput) {
      setPasswordSubStep('input');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      return;
    }
    if (step === 3) {
      animateToStep(2);
      return;
    }
    if (step === 2) {
      animateToStep(1);
      return;
    }
    router.back();
  };

  const stepSubtitle =
    step === 1
      ? 'Enter the phone number linked to your account. We will send you a verification code.'
      : step === 2
        ? `Verify your identity by entering the OTP sent to\n${formatDisplayPhone(phone)}`
        : 'Secure your account with a new password.';

  const showStepper = step === 1 || step === 2 || step === 3;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.whiteBackground} />

      {step !== 4 ? (
        <View style={[styles.topSection, { paddingTop: insets.top + SCREEN_HEADER_PADDING_TOP }]}>
          <HeaderBackButton onPress={goBack} variant="light" />
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={styles.headerSpacer} />
        </View>
      ) : (
        <View style={{ height: insets.top + 12 }} />
      )}

      {showStepper ? (
        <View style={styles.stepIndicatorContainer}>
          <View style={styles.stepperWrapper}>
            {[1, 2, 3].map((stepIdx) => {
              const isActive = step === stepIdx;
              const isCompleted = step > stepIdx;
              const isLast = stepIdx === 3;
              return (
                <View key={stepIdx} style={isLast ? styles.stepperEnd : styles.stepperSegment}>
                  <View
                    style={[
                      styles.stepperCircle,
                      isActive && styles.stepperCircleActive,
                      isCompleted && styles.stepperCircleCompleted,
                    ]}
                  >
                    {isCompleted ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : (
                      <Text
                        style={[
                          styles.stepperNumber,
                          (isActive || isCompleted) && styles.stepperNumberActive,
                        ]}
                      >
                        {stepIdx}
                      </Text>
                    )}
                  </View>
                  {!isLast ? (
                    <View style={[styles.progressBar, isCompleted && styles.progressBarActive]} />
                  ) : null}
                </View>
              );
            })}
          </View>
          <Text style={styles.modernSubtitleText}>{stepSubtitle}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={[
            styles.sheetContent,
            step === 4 && styles.successSheetContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }], width: '100%' }}
          >
            {step === 1 ? (
              <View style={styles.card}>
                <Controller
                  control={phoneForm.control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <PhoneInput
                      label="Mobile Number"
                      variant="flat"
                      value={value}
                      onChangeText={onChange}
                      error={phoneForm.formState.errors.phone?.message}
                    />
                  )}
                />
                <Button
                  title="Send OTP"
                  onPress={phoneForm.handleSubmit(onSendPhoneOtp)}
                  loading={phoneForm.formState.isSubmitting}
                  style={styles.primaryBtn}
                />
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.card}>
                <View style={styles.otpRow}>
                  {Array.from({ length: OTP_LENGTH }, (_, index: number) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        otpRefs.current[index] = ref;
                      }}
                      value={otpDigits[index] ?? ''}
                      onChangeText={(text) => handleOtpChange(index, text)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                      onFocus={() => setOtpFocusedIndex(index)}
                      keyboardType="number-pad"
                      textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                      autoComplete={index === 0 ? 'sms-otp' : 'off'}
                      maxLength={index === 0 ? OTP_LENGTH : 1}
                      selectTextOnFocus
                      style={[
                        styles.otpInput,
                        otpDigits[index] ?? '' ? styles.otpInputFilled : null,
                        otpFocusedIndex === index ? styles.otpInputFocused : null,
                      ]}
                    />
                  ))}
                </View>

                {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

                {resendTimer > 0 ? (
                  <View style={styles.timerBadge}>
                    <Clock3 size={14} color={Colors.textSecondary} />
                    <Text style={styles.timerText}>
                      {`Resend in 00:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}`}
                    </Text>
                  </View>
                ) : (
                  <Pressable style={styles.resendBadge} onPress={() => void resendOtp()}>
                    <RefreshCw size={14} color={Brand.primary} />
                    <Text style={styles.resendBadgeText}>Resend OTP</Text>
                  </Pressable>
                )}

                <Button
                  title="Continue"
                  onPress={goToPasswordStep}
                  disabled={otp.length < OTP_LENGTH}
                  style={styles.primaryBtn}
                />
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.card}>
                <Input
                  label="New Password"
                  variant="flat"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setPasswordError('');
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                />

                {shouldShowConfirmInput ? (
                  <Input
                    label="Confirm Password"
                    variant="flat"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setPasswordError('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                  />
                ) : null}

                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                <Button
                  title="Reset Password"
                  onPress={() => void onResetPassword()}
                  disabled={
                    !shouldShowConfirmInput ||
                    confirmPassword.length < 6 ||
                    !passwordsMatch ||
                    !isLengthValid ||
                    !isComplexityValid
                  }
                  style={styles.primaryBtn}
                />

                <View style={styles.requirementsCard}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthHeader}>
                      <Text style={styles.strengthLabel}>Password Strength</Text>
                      <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
                        {passwordStrength.label}
                      </Text>
                    </View>
                    <View style={styles.strengthBar}>
                      {[0, 1, 2, 3].map((segment) => (
                        <View
                          key={segment}
                          style={[
                            styles.strengthSegment,
                            segment < passwordStrength.score && {
                              backgroundColor: passwordStrength.color,
                              borderColor: passwordStrength.color,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  <RequirementRow
                    valid={isLengthValid}
                    label="At least 6 characters"
                  />
                  <RequirementRow
                    valid={isComplexityValid}
                    label="Includes letters and numbers"
                  />
                  {shouldShowConfirmInput ? (
                    <RequirementRow valid={passwordsMatch} label="Passwords match" />
                  ) : null}
                </View>
              </View>
            ) : null}

            {step === 4 ? (
              <View style={styles.successCard}>
                <View style={styles.successContent}>
                  <View style={styles.successIconWrap}>
                    <CheckCircle2 size={64} color="#10B981" strokeWidth={2} />
                  </View>
                  <Text style={styles.successTitle}>Password Reset Successful</Text>
                  <Text style={styles.successMessage}>
                    Your password has been reset successfully. You can now log in with your new
                    password.
                  </Text>
                </View>
                <Button
                  title="Login"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.primaryBtn}
                />
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {step !== 4 ? (
        <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>Login</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function RequirementRow({ valid, label }: { valid: boolean; label: string }) {
  return (
    <View style={styles.requirement}>
      <CheckCircle2
        size={16}
        color={valid ? '#10B981' : Colors.textTertiary}
        strokeWidth={2.2}
      />
      <Text style={[styles.requirementText, valid && styles.requirementTextValid]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  whiteBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerTitle: { ...Typography.headline, color: Colors.text, fontWeight: '700' },
  headerSpacer: { width: SCREEN_HEADER_SIDE_SIZE },
  stepIndicatorContainer: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 12,
    marginBottom: 4,
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  stepperSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepperEnd: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: 'transparent',
    zIndex: 2,
  },
  stepperCircleActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  stepperCircleCompleted: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  stepperNumber: {
    ...Typography.caption2,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  stepperNumberActive: {
    color: '#fff',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
    zIndex: 1,
  },
  progressBarActive: {
    backgroundColor: Brand.primary,
  },
  modernSubtitleText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sheetContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  successSheetContent: {
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    gap: 16,
    alignItems: 'stretch',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    marginBottom: 4,
  },
  otpInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    textAlign: 'center',
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  otpInputFilled: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  otpInputFocused: {
    borderColor: Brand.primary,
    borderWidth: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timerText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  resendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Brand.primaryMuted,
    borderColor: 'rgba(227, 0, 116, 0.25)',
  },
  resendBadgeText: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
  },
  primaryBtn: {
    width: '100%',
    marginTop: 8,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.danger,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  requirementsCard: {
    width: '100%',
    marginTop: 4,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 10,
  },
  strengthWrap: {
    marginBottom: 4,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  strengthValue: {
    ...Typography.caption1,
    fontWeight: '700',
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthSegment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  requirementText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
  },
  requirementTextValid: {
    color: '#10B981',
    fontWeight: '600',
  },
  successCard: {
    flex: 1,
    minHeight: 420,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  successContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  successIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    marginBottom: 12,
  },
  successTitle: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  successMessage: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
  fixedFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  footerText: { ...Typography.subhead, color: Colors.textSecondary },
  link: { ...Typography.subhead, color: Brand.primary, fontWeight: '600' },
});
