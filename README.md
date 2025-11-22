This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.


stop dahulu metro sebelum run command ini:

cd android
./gradlew clean
cd ..
npx react-native run-android

jika masih gagal cuba run 

npx react-native run-android

selepas menjalankan step 1


jika gagal pada build.gradle: guna langkah ini:

Jika Masih Gagal:
Pastikan tiada import modul yang sudah dipadam dalam kod anda (contoh: import QRLocalImage from 'react-native-qrcode-local-image'; mesti dipadam).
Pastikan tiada kod yang guna modul yang sudah dipadam.
Jika error berkaitan CMake/Native masih keluar, cuba padam folder berikut secara manual:
android/app/build
android/app/.cxx
android/build
node_modules/.cache

ini prompt auto:

Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force android\app\build
Remove-Item -Recurse -Force android\build
Remove-Item -Recurse -Force android\app\.cxx
Remove-Item -Recurse -Force android\app\.externalNativeBuild
Remove-Item -Recurse -Force android\.gradle
Remove-Item -Recurse -Force .gradle
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Android\Sdk\cmake\3.22.1"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Android\Sdk\ndk\27.1.12297006"
npm install
cd android
./gradlew clean
./gradlew assembleRelease



Kemudian ulang langkah 2-6 di atas.

jika asyuik masalah cmake dan ninja guna step ini:
Edit android/gradle.properties:
reactNativeArchitectures=armeabi-v7a,arm64-v8a


1. Homepage
Butang "Imbas QR" akan berada di tengah-tengah skrin, lebih besar, berwarna merah dengan tulisan putih.
Latar belakang putih.
2. Camera
Semua teks (Place QR in the scan area, Pay/Transfer, Receive, Tap to turn on flash, Scan from gallery) akan dibesarkan dan di tengah secara horizontal.
Kamera akan meliputi seluruh skrin (fullscreen).
Bingkai segiempat di tengah untuk membantu pengguna meletakkan QR.
Butang "Scan from gallery" di bawah bingkai.
Semua komponen adalah overlay di atas kamera.
3. Put Amount
Tajuk "DuitNow QR" di tengah atas.
"Amount" di tengah, di bawah tajuk.
Label "Amount" di kiri, diikuti kotak input [MYR (input amount)].
Kotak input "Recipient Reference (optional)" di bawahnya.
Butang "Next" di bawah sekali, besar, merah, tulisan putih.
Latar belakang putih, tiada paparan nama penerima.
4. Approve
Tajuk "Confirmation" di tengah atas.
"Amount" di tengah, diikuti MYR (jumlah) di tengah.
Garisan pemisah.
"To" di kiri, nama penerima di kanan.
"From" di kiri, "YOUTH SAVERS ACCT-i 76367992" di kanan.
Kotak nota berwarna kelabu cerah dengan teks seperti yang anda nyatakan.
Kotak "Total Amount" di bawah, "Total Amount" di kiri, "MYR (jumlah)" di kanan.
Butang "Approve via SecureTAC" di bawah sekali, merah, tulisan putih.
Latar belakang putih, tulisan hitam.
5. Output
"Successful" di tengah atas, hijau.
"Transaction Summary" di bawahnya, hitam, di tengah.
"MYR (jumlah)" di bawahnya, di tengah.
Tarikh & masa (format seperti contoh anda) di bawahnya, di tengah.
Garisan pemisah.
"OCTO Reference No." di kiri, nombor di kanan (bermula 23, 9 digit).
"To" di kiri, nama penerima di kanan.
"From" di kiri, "YOUTH SAVERS ACCT-i 76367992" di kanan.
Butang share bulat, light grey, icon putih.
Butang "Done" di bawah sekali, merah, tulisan putih, kembali ke homepage bila ditekan.