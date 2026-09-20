// Local Expo config plugin — strips Android permissions that Expo's default
// prebuild manifest template (or a transitive module) adds but the YOMICO
// Customer App does not use.
//
// Expo's base Android manifest template (@expo/config-plugins withAndroidBaseMods)
// seeds SYSTEM_ALERT_WINDOW ("draw over other apps") as an OPTIONAL permission.
// The Customer App never draws overlays — only React Native's dev overlay uses
// it (debug only) — so it must not ship in the release AAB.
//
// RECORD_AUDIO can be pulled in transitively (e.g. by media/image-picker
// modules). The Customer App never records audio — image-picker is used only
// for still review photos (expo-image-picker microphonePermission:false) — so
// RECORD_AUDIO is blocked here as the explicit source of truth / defense in
// depth, independent of any single module's own permission option.
//
// Each entry is emitted as `tools:node="remove"` in the merged manifest so it
// is stripped from every build variant. This plugin touches nothing else —
// INTERNET, VIBRATE, camera and the image-picker media permissions are left
// intact.
const { AndroidConfig, withPlugins } = require("expo/config-plugins");

const BLOCKED_ANDROID_PERMISSIONS = [
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.RECORD_AUDIO",
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
