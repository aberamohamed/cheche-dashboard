const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * On Android 12+ (API 31+), BLUETOOTH_SCAN normally requires system Location
 * Services to be enabled before BluetoothAdapter.startDiscovery() will
 * actually start (it silently returns false otherwise). Declaring the
 * android:usesPermissionFlags="neverForLocation" attribute tells the OS this
 * app never derives location from Bluetooth scan results, which lifts that
 * requirement — needed since we only use scanning to list nearby printers.
 */
function withBluetoothNeverForLocation(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const usesPermissions = manifest['uses-permission'] ?? [];

    for (const permission of usesPermissions) {
      const name = permission.$?.['android:name'];
      if (name === 'android.permission.BLUETOOTH_SCAN') {
        permission.$['android:usesPermissionFlags'] = 'neverForLocation';
      }
    }

    return config;
  });
}

module.exports = withBluetoothNeverForLocation;
