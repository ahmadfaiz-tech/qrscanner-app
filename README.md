# DuitNow QR Scanner App

A React Native mobile application that simulates a CIMB Bank DuitNow payment flow with QR code scanning capabilities. This is a learning/portfolio project demonstrating modern mobile development practices and payment interface design.

![React Native](https://img.shields.io/badge/React_Native-0.79.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-3178C6?logo=typescript)
![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android)

## About the Project

This app demonstrates a complete DuitNow QR payment flow, from scanning to transaction confirmation. It features real-time QR code detection, smart merchant name extraction using EMVCo TLV parsing, and a professional banking-inspired UI.

**⚠️ Important Disclaimer:** This is a **frontend prototype only** for learning and demonstration purposes. No actual payments are processed, and there is no connection to any banking API or payment gateway.

## Features

- **QR Code Scanning**
  - Live camera scanning with custom overlay frame
  - Scan from gallery images (JPEG support)
  - Real-time QR code detection and validation
  - Automatic merchant name extraction

- **Smart Data Extraction**
  - EMVCo TLV parser for DuitNow QR codes
  - Extracts merchant name from tag 59 (Merchant Name field)
  - Handles standard PayNet/DuitNow QR format

- **Complete Payment Flow (5 Screens)**
  1. **Homepage** - Simple landing page with "Scan QR" button
  2. **Camera** - Full-screen camera view with Pay/Transfer toggle
  3. **Put Amount** - Amount entry with automatic MYR formatting
  4. **Approve** - Confirmation screen with transaction details
  5. **Output** - Success screen with transaction receipt

- **Currency Formatting**
  - Automatic decimal placement (e.g., "100" → "1.00")
  - Real-time input validation
  - Professional MYR display format

- **Transaction Logging**
  - Saves to local device storage (`transactions.md`)
  - Timestamp tracking
  - 9-digit OCTO reference number generation

- **UI/UX Features**
  - Real-time clock display
  - Linear gradient backgrounds
  - Bank-inspired professional design
  - Material Icons integration
  - Custom Calibri font family

## Tech Stack

### Core Framework
- **React Native** 0.79.2
- **TypeScript** 5.0.4
- **React** 19.0.0

### Camera & QR Scanning
- `react-native-vision-camera` (4.6.4) - Primary camera interface
- `vision-camera-dynamsoft-barcode-reader` (2.2.1) - QR code detection engine
- `react-native-image-picker` (8.2.1) - Gallery image selection
- `jsqr` (1.4.0) - QR decoding from static images
- `jpeg-js` (0.4.4) - JPEG image processing

### UI Components
- `react-native-vector-icons` (10.2.0) - Material Icons
- `react-native-linear-gradient` (2.8.3) - Gradient backgrounds
- `react-native-safe-area-context` (5.4.1) - Safe area handling

### File System & Permissions
- `react-native-fs` (2.20.0) - Local file operations
- `react-native-permissions` (5.4.1) - Camera & gallery access

### Other Dependencies
- `react-native-reanimated` (3.18.0)
- `react-native-gesture-handler` (2.25.0)
- `react-native-worklets-core` (1.5.0)

## Installation & Setup

### Prerequisites

- **Node.js** >= 18
- **React Native development environment** ([Setup Guide](https://reactnative.dev/docs/set-up-your-environment))
- **Android SDK** (for Android development)
- **Android device or emulator**

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ahmadfaiz-tech/qrscanner-app.git
   cd QrScannerApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Link custom fonts**
   ```bash
   npx react-native-asset
   ```

4. **Start Metro bundler**
   ```bash
   npm start
   ```

5. **Run on Android**

   In a new terminal window:
   ```bash
   npm run android
   ```

   Or using the VS Code task (Ctrl+Shift+B):
   - Select **🤖 Build Android**

## Usage Guide

### Scanning QR Codes

1. **Launch the app** and tap the "Imbas QR" (Scan QR) button on the homepage
2. **Grant camera permissions** when prompted
3. **Point the camera** at a DuitNow QR code
   - The app will automatically detect and extract the merchant name
   - Alternatively, tap "Scan from gallery" to select a QR image

### Making a Payment

1. After scanning, enter the **payment amount** (e.g., type "1000" for MYR 10.00)
2. Optionally add a **recipient reference**
3. Tap **"Next"** to review transaction details
4. Tap **"Approve via SecureTAC"** to simulate payment approval
5. View the **transaction receipt** with reference number and timestamp

### Transaction Records

All transactions are saved locally to `transactions.md` in the format:
```
- Transaksi: [Merchant Name], MYR [Amount], [Timestamp]
```

## Special Implementation: EMVCo TLV Parser

This app includes a custom parser for extracting merchant names from DuitNow QR codes, which follow the **EMVCo QR code standard** using **TLV (Tag-Length-Value)** format.

### How It Works

The `extractFullName` function (App.tsx:61-76) parses the merchant name:

```typescript
const extractFullName = (qrData: string): string => {
  // Match tag 59 (Merchant Name) and capture the 2-digit length
  const nameField = qrData.match(/59(\d{2})/);

  if (nameField) {
    const length = parseInt(nameField[1], 10);  // Get the length value
    const startIndex = nameField.index! + 4;     // Position after "59XX"
    const merchantName = qrData.substring(startIndex, startIndex + length);
    return merchantName;
  }
  return 'Nama tidak ditemui';  // Name not found
};
```

### TLV Format Explanation

- **Tag 59** = Merchant Name (EMVCo standard field)
- **Length** = 2-digit number indicating how many characters follow
- **Value** = The actual merchant name

**Example:**
- QR Data: `...5924KAFETERIA D SELERA BONDA6002MY...`
- Parsed: Tag `59`, Length `24`, Value `KAFETERIA D SELERA BONDA`
- Result: "KAFETERIA D SELERA BONDA"

This ensures accurate extraction without capturing trailing data like country codes or other fields.

## Project Structure

```
D:\Projects\QrScannerApp\
├── android/              # Android native code & configuration
├── ios/                  # iOS native code (not configured)
├── assets/
│   └── fonts/           # Calibri font family (Regular, Bold, Italic, Bold Italic)
├── screenshots/         # App screenshots & documentation
├── .vscode/
│   └── tasks.json       # VS Code build/save/restore tasks
├── App.tsx              # Main application code (~557 lines)
├── package.json         # Dependencies & scripts
├── babel.config.js      # Babel configuration
├── tsconfig.json        # TypeScript configuration
├── react-native.config.js # Asset linking configuration
├── save.js              # GitHub backup script
├── restore.js           # GitHub restore script
├── centeng.png          # Success checkmark icon
└── README.md            # This file
```

## Troubleshooting

### Build Failures

If you encounter build errors, try cleaning the Android build:

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### CMake/Native Build Issues

For persistent native build issues, clean all build artifacts:

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force android\app\build
Remove-Item -Recurse -Force android\build
Remove-Item -Recurse -Force android\app\.cxx
Remove-Item -Recurse -Force android\app\.externalNativeBuild
Remove-Item -Recurse -Force android\.gradle
Remove-Item -Recurse -Force .gradle
npm install
cd android
./gradlew clean
```

### Architecture-Specific Build Issues

If encountering CMake/Ninja errors, limit build architectures by editing `android/gradle.properties`:

```properties
reactNativeArchitectures=armeabi-v7a,arm64-v8a
```

### Permission Issues

Ensure the following permissions are granted:
- **Camera** access (for QR scanning)
- **Gallery/Storage** access (for image selection)
  - Android 13+: `READ_MEDIA_IMAGES`
  - Android 12 and below: `READ_EXTERNAL_STORAGE`

### Metro Bundler Issues

Stop Metro and restart:
```bash
# Stop Metro (Ctrl+C)
npm start -- --reset-cache
```

## Important Notes & Limitations

### This is NOT:
- ❌ A production payment application
- ❌ Connected to any banking API or payment gateway
- ❌ Processing real money transfers
- ❌ Secure for actual financial transactions
- ❌ Available on iOS (Windows development only)

### This IS:
- ✅ A learning/portfolio project
- ✅ A frontend prototype demonstrating React Native skills
- ✅ Android-only application
- ✅ Suitable for understanding QR scanning implementation
- ✅ A demonstration of TypeScript + React Native capabilities
- ✅ Educational reference for EMVCo TLV parsing

### Simulated Features
- **Account:** Hardcoded as "SAVERS ACCT-i 7636717112"
- **Reference Numbers:** Generated starting with "2" (9 digits)
- **Clock:** Real-time display, updates every second
- **Transactions:** Saved locally only, not transmitted anywhere

## Development Tools

### VS Code Tasks

Use **Ctrl+Shift+B** to access build tasks:
- **🤖 Build Android** - Build and run on Android device/emulator
- **💾 Save** - Backup project to GitHub with custom commit message
- **🔄 Restore** - Restore project from GitHub backup branches

### Scripts

**Backup to GitHub:**
```bash
node save.js "Your commit message"
```

**Restore from backup:**
```bash
node restore.js
```

## Learn More

### React Native Resources
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript for React Native](https://reactnative.dev/docs/typescript)

### QR Code Standards
- [EMVCo QR Code Specification](https://www.emvco.com/emv-technologies/qrcodes/)
- [PayNet DuitNow](https://www.paynet.my/duitnow/)

### Vision Camera
- [React Native Vision Camera Docs](https://react-native-vision-camera.com/)
- [Dynamsoft Barcode Reader](https://www.dynamsoft.com/barcode-reader/sdk-mobile/)

## License

This project is for educational and portfolio purposes. Not licensed for commercial use.

## Author

**Ahmad Faiz**
- GitHub: [@ahmadfaiz-tech](https://github.com/ahmadfaiz-tech)
- Repository: [qrscanner-app](https://github.com/ahmadfaiz-tech/qrscanner-app)

---

**Built with ❤️ using React Native and TypeScript**
