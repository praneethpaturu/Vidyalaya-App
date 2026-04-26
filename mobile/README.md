# Lakshya MCB — Android Wrapper

Capacitor-based Android shell for the Lakshya / MCB web app. **The web codebase under `../` is unchanged.** This project produces an Android `.apk` (debug) or `.aab` (Play Store release) that wraps the deployed website.

## How it works

The wrapper loads the live web app inside an Android WebView and exposes native capabilities (push notifications, camera, biometric, file system) via Capacitor plugins. Web changes ship through your normal Next.js deploy — no app re-release needed unless you change native code.

```
mobile/
├─ capacitor.config.ts     # appId, webDir, server.url, plugin config
├─ www/                    # fallback HTML if the web URL is unreachable
├─ android/                # Android Studio project (Gradle)
└─ package.json            # capacitor + plugins
```

## Prerequisites (one-time)

| Tool | Why | Install |
|---|---|---|
| Android Studio (Hedgehog or newer) | Build / run on emulator / sign release | https://developer.android.com/studio |
| JDK 17 | Capacitor 6 requires JDK 17 | `brew install --cask temurin@17` |
| Android SDK Platform 34 + Build Tools 34 | Compile target | Install via Android Studio → SDK Manager |

After install, set in `~/.zshrc`:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

## Run on emulator (dev workflow)

```bash
# 1. Make sure the web is running (separate terminal, in repo root)
cd ..
npm run dev          # http://localhost:3000

# 2. Open Android Studio → Device Manager → start a Pixel 6 emulator
# 3. From this directory:
cd mobile
npx cap run android
```

The emulator reaches your Mac's localhost via `http://10.0.2.2:3000`. That's hard-coded as the default in `capacitor.config.ts`.

## Run on a physical device

The phone needs to reach your Mac on the LAN. Find your Mac's IP:

```bash
ipconfig getifaddr en0    # e.g. 192.168.1.42
```

Then build with that URL:

```bash
LAKSHYA_WEB_URL=http://192.168.1.42:3000 npx cap sync android
npx cap run android --target=<deviceId>
```

Phone and Mac must be on the same WiFi.

## Build a debug APK

```bash
LAKSHYA_WEB_URL=https://your-domain.tld npx cap sync android
npm run build:apk
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk` — install with `adb install <path>`.

## Build a Play Store release (.aab)

1. Generate a signing key once:
   ```bash
   keytool -genkey -v -keystore ~/lakshya-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias lakshya
   ```
2. Add credentials to `android/key.properties` (gitignore it):
   ```
   storeFile=/Users/you/lakshya-release.jks
   storePassword=...
   keyAlias=lakshya
   keyPassword=...
   ```
3. Reference it from `android/app/build.gradle` (`signingConfigs.release`).
4. Build:
   ```bash
   LAKSHYA_WEB_URL=https://your-domain.tld npx cap sync android
   npm run build:aab
   ```

Output: `android/app/build/outputs/bundle/release/app-release.aab`.

## Native plugins linked

| Plugin | Use case |
|---|---|
| `@capacitor/push-notifications` | FCM for circulars / fee reminders / attendance |
| `@capacitor/camera` | Visitor entry photos, profile uploads |
| `@capacitor/filesystem` | Saving receipts, ID-card PDFs |
| `@capacitor/network` | Offline mode awareness |
| `@capacitor/preferences` | Remember last-known server URL |
| `@capacitor/browser` | Open external links (parent payment gateway) |
| `@capacitor/haptics` | Subtle feedback on actions |
| `@capacitor/status-bar` | Branded status-bar tint |
| `@capacitor/splash-screen` | Animated splash with school crest |
| `@capacitor/app` | Hardware back button, app state events |
| `@aparajita/capacitor-biometric-auth` | Fingerprint / face unlock for parent login |

## Hooking native plugins into the web

The wrapper loads your web app as-is. To call a native plugin from the Next.js code, add a thin client helper:

```ts
// in vidyalaya/ root, e.g. lib/native.ts
"use client";
import { Capacitor } from "@capacitor/core";

export const isNative = () =>
  typeof window !== "undefined" && Capacitor?.isNativePlatform();

export async function ensurePush() {
  if (!isNative()) return;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.requestPermissions();
  await PushNotifications.register();
}
```

The web app then guards plugin calls behind `isNative()`. In a normal browser this is a no-op — the website keeps working unchanged.

## Updating native code

After editing `capacitor.config.ts`, plugins, or anything in `android/`:

```bash
npx cap sync android      # copies www/, syncs plugins, refreshes gradle
```

## What the user needs to do

1. Install Android Studio + JDK 17 + Android SDK 34 (one-time).
2. `cd mobile && npm install` (already done if you cloned with `node_modules`).
3. Decide a server URL (local dev, staging, prod) and set `LAKSHYA_WEB_URL` for builds.
4. `npx cap run android` to launch on emulator, or `npm run build:apk` for a debug APK.

## Troubleshooting

| Symptom | Fix |
|---|---|
| White screen on launch, then "Unable to reach the school server" | Web URL unreachable. Check `LAKSHYA_WEB_URL`. From emulator use `10.0.2.2`. From device use Mac LAN IP. Both need cleartext HTTP enabled (default in dev). |
| `JAVA_HOME is not set` on `cap run android` | Install JDK 17 and `export JAVA_HOME` (see above). |
| Gradle sync fails on first open | Open `mobile/android/` in Android Studio once — let it download Gradle + SDK platforms automatically. |
| Push notifications don't arrive | You also need to upload `google-services.json` from Firebase to `android/app/`. See the FCM setup guide. |
| Login cookies don't persist | Ensure your web URL uses HTTPS in production. WebView handles cookies normally otherwise. |
