import type { CapacitorConfig } from "@capacitor/cli";

// Standalone bundled-assets mode: the entire app ships inside the APK under
// www/. No server.url means Capacitor loads the bundled HTML — the app runs
// fully offline. Users can optionally enter a school server URL inside the
// app to sync with a hosted backend (handled in JS at runtime).
const config: CapacitorConfig = {
  appId: "in.lakshya.mcb",
  appName: "Lakshya MCB",
  webDir: "www",

  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== "production",
    backgroundColor: "#0f2d5e",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0f2d5e",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: "#0f2d5e",
      style: "DARK",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Camera: {
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
