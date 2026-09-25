# SaNDSLab Simple Accounting System - Development Notes & Handover

**Project Directory:** `E:\SimpleAccounting`  
**Date & Time Saved:** September 21, 2026 (02:45 AM)  
**Status:** ✅ Stable, fully functional, and verified live on both Web and Mobile devices.

---

## 1. Project Overview & Architecture

A complete multi-platform accounting and bookkeeping system designed for rapid daily entry via mobile (with receipt photo capture) and full reporting, analytics, and Excel exports on the web.

```
SimpleAccounting/
├── api/                    # PHP REST API Endpoints
│   ├── config.php          # Database PDO connection & CORS headers
│   ├── accounts.php        # Account CRUD & real-time balance calculations
│   ├── categories.php      # Income/Expense categories
│   ├── transactions.php    # Transaction ledger, filtering, search, pagination
│   ├── reports.php         # KPI calculations, 12-month trends, category breakdowns
│   ├── settings.php        # Multi-currency (BHD, SAR, AED, INR), timezone, date format
│   ├── upload.php          # Base64/Multipart file upload for receipts & invoices
│   └── export_excel.php    # Multi-tab financial Excel (.xlsx) generator
├── backend/
│   └── db/
│       ├── schema.sql           # Complete MySQL database structure & indexes
│       └── migrate_and_seed.php # Database migration & demo data seeder script
├── web/                    # React JS + Vite Web Application
│   ├── src/
│   │   ├── components/     # HorizontalNavbar, Dashboard, TransactionsList, ReportsCenter, etc.
│   │   ├── context/        # AppContext (state management & toast notifications)
│   │   └── App.jsx         # Full-width horizontal layout & view router
│   └── package.json
└── mobile/                 # React Native (Expo SDK 57) Mobile Application
    ├── src/
    │   ├── screens/        # HomeScreen, AddTransactionScreen, HistoryScreen, SettingsScreen
    │   └── context/        # MobileContext (AsyncStorage, LAN/Cloud sync)
    ├── App.js              # SafeAreaProvider, Tab Navigation & Modals
    └── package.json        # Expo SDK 57, React 19.2.3, React Native 0.86.3
```

---

## 2. Database Environments & Credentials

| Environment | Host | Database Name | Username | Password | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local MySQL** | `localhost` | `simple_accounting` | `root` | `S@nds1@b` | Active & Seeded |
| **Production Cloud** | `simpleacc.sandslab.com` | `sandsl23_simpleacc_db` | `sandsl23_simpleacc_user` | `S@nds1@b` | Ready for deployment |

---

## 3. Quick Startup Commands (To Resume in 5 Hours)

To restart all services cleanly after your break, open PowerShell in `E:\SimpleAccounting` and run:

### Step 1: Start PHP API Server (Port 3031)
```powershell
cd E:\SimpleAccounting
php -S 0.0.0.0:3031 -t .
```
*(Runs on `http://0.0.0.0:3031` accessible by localhost, LAN `192.168.8.11`, and mobile).*

### Step 2: Start Web Dashboard (Port 5173)
```powershell
cd E:\SimpleAccounting\web
npm run dev
```
*(Access at `http://localhost:5173/` or `http://192.168.8.11:5173/`).*

### Step 3: Start Mobile Metro Bundler (Port 8081)
```powershell
cd E:\SimpleAccounting\mobile
cmd /c "set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.8.11 && npx expo start --host lan --port 8081"
```
*(Open **Expo Go** on your phone to load the live app).*

*(Optional if testing via USB ADB)*:
```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3031 tcp:3031
```

---

## 4. Key Accomplishments & Features Ready

1. **Branding & Look**:
   - Incorporated official **SaNDSLab Logo**: `https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png`
   - Default **Light Theme** with **Dark Theme toggle**.
   - **Horizontal Top Navigation Bar** on Web to maximize data viewing area.

2. **Currency & Localization Settings**:
   - **Default Currency**: Bahrain Dinar (`BHD` with 3 decimals: `0.000 BHD`).
   - GCC Currencies (`SAR`, `AED`, `QAR`, `KWD`, `OMR`) and India (`INR`).
   - Default Timezone: `Asia/Bahrain`.
   - Default Date Format: `DD/MM/YYYY`.

3. **Account Hierarchy & Office Petty Cash**:
   - **`Office Petty Cash`** is explicitly configured as the **#1 first option** across all account selectors and dropdowns on both Mobile and Web.
   - Bank-to-Petty Cash transfers and Petty Cash expenses are seamlessly pre-selected.

4. **Mobile App (Expo SDK 57)**:
   - Upgraded to Expo SDK 57 (`expo ~57.0.0`, `react 19.2.3`, `react-native 0.86.3`) matching device Expo Go 57.0.9.
   - Quick entry buttons: **`+ Expense`**, **`+ Income`**, **`Transfer`**, **`Other`**.
   - Camera & Gallery receipt capture with instant preview and backend upload.
   - Live synchronization with database.

5. **Web Reports & Analytics**:
   - Visual KPI cards (Total Liquid Assets, Net Profit, Bank & Cash balances).
   - Monthly 12-month revenue vs expense bar charts.
   - Expense & Income category donut breakdowns.
   - Multi-tab Excel (.xlsx) export with complete audit ledger.

---

## 5. Next Steps for Next Session

1. **Cloud Server Sync & Deployment**:
   - Upload API scripts to `simpleacc.sandslab.com`.
   - Run database schema migration on `sandsl23_simpleacc_db`.
2. **User Roles & Auth**:
   - Optional login credentials / multi-user access permissions if needed.
3. **Printable Vouchers & Invoices**:
   - PDF export / print formatting for payment vouchers and receipts.
