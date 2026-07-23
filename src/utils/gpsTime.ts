import * as Location from 'expo-location';

/**
 * Returns the timestamp of a FRESH GPS fix only, or null when one can't be
 * obtained (permission denied, services off, no fix). Never falls back to the
 * device clock or stale last-known fixes — callers use this to verify the
 * device clock against satellite time, so a cached fix would report a bogus
 * offset equal to its age.
 */
export async function getFreshGpsDate(): Promise<Date | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true,
    });
    return position?.timestamp ? new Date(position.timestamp) : null;
  } catch {
    return null;
  }
}

/**
 * Returns an ISO timestamp from a GPS/high-accuracy location fix.
 * Prefer a fresh GPS reading; fall back to last-known GPS fix; only then device clock.
 */
export async function getGpsIsoTimestamp(): Promise<string> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return new Date().toISOString();
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 15 * 60 * 1000,
        requiredAccuracy: 100,
      });
      if (lastKnown?.timestamp) {
        return new Date(lastKnown.timestamp).toISOString();
      }
      return new Date().toISOString();
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });
      if (position?.timestamp) {
        return new Date(position.timestamp).toISOString();
      }
    } catch {
      // Fall through to last-known.
    }

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 30 * 60 * 1000,
      requiredAccuracy: 200,
    });
    if (lastKnown?.timestamp) {
      return new Date(lastKnown.timestamp).toISOString();
    }
  } catch {
    // Ignore and fall back.
  }

  return new Date().toISOString();
}
