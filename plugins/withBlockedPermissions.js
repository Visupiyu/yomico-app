// Local Expo config plugin — strips Android permissions that Expo's default
// prebuild manifest template adds but the YOMICO Customer App does not use.
//
// Expo's base Android manifest template (@expo/config-plugins withAndroidBaseMods)
// seeds SYSTEM_ALERT_WINDOW ("draw over other apps") as an OPTIONAL permission.
// The Customer App never draws overlays — only React Native's dev overlay uses
// it (debug only) — so it must not ship in the release AAB. This plugin adds it
// to the blocked list, which emits `tools:node="remove"` in the merged manifest
// so it is stripped from every build variant. It touches nothing else.
const { AndroidConfig, withPlugins } = require("expo/config-plugins");

const BLOCKED_ANDROID_PERMISSIONS = [
  "android.permission.SYSTEM_ALERT_WINDOW",
];

module.exports = function withBlockedPermissions(config) {
  return withPlugins(config, [
    (cfg) =>
      AndroidConfig.Permissions.withBlockedPermissions(
        cfg,
        BLOCKED_ANDROID_PERMISSIONS
      ),
  ]);
};
