# 📱 Simple Accounting — Android APK Build & Installation Guide

This document contains the complete step-by-step procedure to build, export, install, and configure the **Simple Accounting Mobile App (.apk)** on any Android device.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Building the APK (Step-by-Step)](#building-the-apk-step-by-step)
3. [Installing the APK on Any Android Device](#installing-the-apk-on-any-android-device)
4. [First-Launch Server Configuration](#first-launch-server-configuration)
5. [Switching or Changing Server Endpoints](#switching-or-changing-server-endpoints)
6. [Troubleshooting & Connection Fallback](#troubleshooting--connection-fallback)
7. [One-Click Rebuild Command](#one-click-rebuild-command)

---

## 1. ⚙️ Prerequisites

Make sure the following tools are installed on the machine:
- **Node.js** (v18+ or v22+)
- **Java JDK** (JDK 17 LTS)
- **Android SDK** (located at `C:\Users\<Username>\AppData\Local\Android\Sdk`)
- **Git**

---

## 2. 🔨 Building the APK (Step-by-Step)

### Step 1: Open PowerShell / Terminal in the project root
```powershell
cd e:\SimpleAccounting
```

### Step 2: Set Android SDK Environment Variables
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin"
```

### Step 3: Run Expo Prebuild (Generates Android Native Project)
```powershell
cd e:\SimpleAccounting\mobile
npx expo prebuild --platform android --clean --no-install
```

### Step 4: Configure Android SDK Path
Ensure `local.properties` in `mobile/android` points to your SDK:
```powershell
Set-Content -Path "e:\SimpleAccounting\mobile\android\local.properties" -Value "sdk.dir=$($env:LOCALAPPDATA -replace '\\', '\\')\\Android\\Sdk"
```

### Step 5: Compile and Assemble the Standalone APK with Gradle
```powershell
cd e:\SimpleAccounting\mobile\android
.\gradlew.bat assembleRelease
```

### Step 6: Copy the Generated APK to Root Folder
```powershell
Copy-Item "e:\SimpleAccounting\mobile\android\app\build\outputs\apk\release\app-release.apk" "e:\SimpleAccounting\SimpleAccounting.apk"
```
The standalone APK is now ready at: **`e:\SimpleAccounting\SimpleAccounting.apk`**

---

## 3. 📲 Installing the APK on Any Android Device

### Method A: Transfer via USB / WhatsApp / Google Drive / Nearby Share
1. Copy `SimpleAccounting.apk` to the target Android phone.
2. Open the file manager on the phone and tap **`SimpleAccounting.apk`**.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps"*:
   - Tap **Settings** → Enable **Allow from this source**.
4. Tap **Install** → **Open**.

### Method B: Install Directly via USB Cable (ADB)
If the phone has **Developer Options & USB Debugging** enabled:
```powershell
adb install -r e:\SimpleAccounting\SimpleAccounting.apk
```

---

## 4. 🌐 First-Launch Server Configuration

When opening the app for the first time:
1. You will see the **"🚀 Server Endpoint Setup"** wizard.
2. Select one of the quick presets or type your custom server URL:
   - **Local Wi-Fi Network:** `http://192.168.8.11:3031` (Replace with host PC's Wi-Fi IP)
   - **USB ADB Tethering:** `http://127.0.0.1:3031`
   - **Cloud Server:** `https://simpleacc.sandslab.com`
3. Tap **"🚀 Test & Connect to Server"**.
4. Once connection test passes with `✅ Connection Successful`, tap **"Save & Continue to App"**.
5. The endpoint is permanently saved on the phone via `AsyncStorage`.

---

## 5. 🔄 Switching or Changing Server Endpoints

If you change Wi-Fi networks or switch to cloud:
1. Open the app → Tap **Settings** (bottom navigation tab).
2. Under **"API Server Endpoint"**, you can:
   - Edit the URL directly and tap **"Save Endpoint"**, OR
   - Tap **"⚙️ Full Setup Wizard / Switch Server"** to use the interactive ping tester.

---

## 6. 🚨 Troubleshooting & Connection Fallback

- **"⚠️ Server Unreachable / Error" Banner:**
  - If the server IP changes or the backend is offline, a red banner appears at the top.
  - Tap **"⚙️ Fix URL"** on the banner to immediately reopen the Setup Wizard and test a new address.
- **Firewall Check (Host PC):**
  - Ensure Windows Defender Firewall allows incoming connections on port `3031`:
    ```powershell
    netsh advfirewall firewall add rule name="SimpleAccounting API 3031" dir=in action=allow protocol=TCP localport=3031
    ```

---

## 7. ⚡ One-Click Fast Rebuild Script

To rebuild the APK at any time in the future, run this single command in PowerShell:

```powershell
cd e:\SimpleAccounting; .\update-icons.ps1; cd mobile\android; .\gradlew.bat assembleRelease; Copy-Item "app\build\outputs\apk\release\app-release.apk" "e:\SimpleAccounting\SimpleAccounting.apk" -Force; Write-Host "✅ Standalone APK Ready: e:\SimpleAccounting\SimpleAccounting.apk" -ForegroundColor Green
```
