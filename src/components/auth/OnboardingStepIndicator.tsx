import { Brand, Colors, Typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type OnboardingStepIndicatorProps = {
  step: 1 | 2 | 3;
  totalSteps?: number;
  accentStepLabel?: boolean;
};

const CIRCLE_SIZE = 34;
const CONNECTOR_HEIGHT = 2;

export function OnboardingStepIndicator({
  step,
  totalSteps = 3,
  accentStepLabel = false,
}: OnboardingStepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);
  const connectorCount = totalSteps - 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {connectorCount > 0 ? (
          <View style={styles.connectorsRow} pointerEvents="none">
            {Array.from({ length: connectorCount }, (_, index) => {
              const segmentStep = index + 1;
              const isActive = step > segmentStep;

              return (
                <View
                  key={`connector-${segmentStep}`}
                  style={[styles.connector, isActive && styles.connectorActive]}
                />
              );
            })}
          </View>
        ) : null}

        <View style={styles.circlesRow}>
          {steps.map((index) => {
            const isActive = index === step;
            const isComplete = index < step;

            return (
              <View
                key={index}
                style={[
                  styles.circle,
                  isActive && styles.circleActive,
                  isComplete && styles.circleComplete,
                  !isActive && !isComplete && styles.circleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    (isActive || isComplete) && styles.circleTextActive,
                  ]}
                >
                  {index}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={[styles.stepLabel, accentStepLabel && styles.stepLabelAccent]}>
        Step {step} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: CIRCLE_SIZE,
    justifyContent: 'center',
  },
  connectorsRow: {
    position: 'absolute',
    left: CIRCLE_SIZE / 2,
    right: CIRCLE_SIZE / 2,
    top: CIRCLE_SIZE / 2 - CONNECTOR_HEIGHT / 2,
    flexDirection: 'row',
    gap: 0,
    height: CONNECTOR_HEIGHT,
  },
  connector: {
    flex: 1,
    height: CONNECTOR_HEIGHT,
    backgroundColor: 'rgba(120,120,128,0.22)',
  },
  connectorActive: {
    backgroundColor: Brand.primary,
  },
  circlesRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: Colors.white,
    zIndex: 1,
  },
  circleActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  circleComplete: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  circleInactive: {
    backgroundColor: Colors.white,
    borderColor: 'rgba(120,120,128,0.28)',
  },
  circleText: {
    ...Typography.subhead,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  circleTextActive: {
    color: Colors.white,
  },
  stepLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  stepLabelAccent: {
    color: Brand.primary,
    fontWeight: '700',
  },
});
