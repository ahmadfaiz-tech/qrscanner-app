import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Appearance, StatusBar, Image, PermissionsAndroid, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { decodeFile } from 'vision-camera-dynamsoft-barcode-reader';
import ImageEditor from "@react-native-community/image-editor";
import jsQR from 'jsqr';
import { Buffer } from 'buffer';
import jpeg from 'jpeg-js';

// Paksa mod terang untuk mengelakkan mod gelap
Appearance.setColorScheme('light');

const App = () => {
  const [page, setPage] = useState('Homepage');
  const [qrData, setQrData] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [currentTime, setCurrentTime] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  // Real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const day = now.getDate().toString().padStart(2, '0');
      const formattedTime = `${formattedHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
      setCurrentTime(
        `${day} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} ${formattedTime}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Request camera permission
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        console.log('Status kebenaran kamera:', granted);
        if (!granted) {
          Alert.alert('Ralat', 'Kebenaran kamera diperlukan untuk mengimbas kod QR.');
        }
      });
    }
  }, [hasPermission]);

  // Extract name from QR data (EMVCo TLV format)
  const extractFullName = (qrData: string): string => {
    // Match tag 59 (Merchant Name) and capture the 2-digit length
    const nameField = qrData.match(/59(\d{2})/);

    if (nameField) {
      const length = parseInt(nameField[1], 10);
      const startIndex = nameField.index! + 4; // Position after "59XX"
      const merchantName = qrData.substring(startIndex, startIndex + length);

      console.log('Nama yang diekstrak:', merchantName);
      return merchantName;
    } else {
      console.log('Tiada nama sepadan dalam QR data:', qrData);
      return 'Nama tidak ditemui';
    }
  };

  // Save transaction to markdown file
  const saveTransaction = async (name: string, amount: string, time: string) => {
    const transaction = `- Transaksi: ${name}, MYR ${amount}, ${time}\n`;
    const path = `${RNFS.DocumentDirectoryPath}/transactions.md`;
    try {
      await RNFS.appendFile(path, transaction, 'utf8');
    } catch (error) {
      console.error('Gagal menyimpan transaksi:', error);
    }
  };

  // Format input amount
  const formatAmountInput = (input: string) => {
    const numericInput = input.replace(/[^0-9]/g, '');
    if (!numericInput) return '0.00';
    const paddedInput = numericInput.padStart(2, '0');
    const decimalPart = paddedInput.slice(-2);
    const integerPart = paddedInput.slice(0, -2) || '0';
    const formattedInteger = parseInt(integerPart, 10).toString();
    return `${formattedInteger}.${decimalPart}`;
  };

  // Format output amount
  const formatAmountOutput = (input: string) => {
    const [integerPart, decimalPart] = input.split('.');
    const formattedInteger = parseInt(integerPart, 10).toString();
    return `${formattedInteger}.${decimalPart}`;
  };

  // QR Code Scanner
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        const qrValue = codes[0].value || '';
        console.log('Kod QR diimbas:', qrValue);
        setQrData(qrValue);
        setName(extractFullName(qrValue));
        setPage('PutAmount');
      }
    },
  });

  // Fungsi untuk memilih imej dari galeri dan imbas QR menggunakan jsQR
  const scanQRFromGallery = async () => {
    const allowed = await requestGalleryPermission();
    if (!allowed) {
      Alert.alert('Ralat', 'Kebenaran galeri tidak diberikan.');
      return;
    }
    const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true });
    const asset = result.assets?.[0];
    if (asset?.base64) {
      try {
        const buffer = Buffer.from(asset.base64, 'base64');
        const rawImageData = jpeg.decode(buffer, { useTArray: true });
        const code = jsQR(rawImageData.data, rawImageData.width, rawImageData.height);
        if (code) {
          setQrData(code.data);
          setName(extractFullName(code.data));
          setPage('PutAmount');
        } else {
          Alert.alert('Ralat', 'Tiada kod QR dikesan dalam imej');
        }
      } catch (err) {
        Alert.alert('Ralat', 'Gagal memproses imej. Sila cuba gambar lain.');
      }
    } else {
      Alert.alert('Ralat', 'Gambar tidak mengandungi data base64.');
    }
  };

  // Generate random OCTO reference number
  const generateReferenceNumber = () => {
    const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
    return '2' + randomPart;
  };

  // Render Homepage
  if (page === 'Homepage') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7f7', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ backgroundColor: '#00A3AD', paddingVertical: 24, paddingHorizontal: 48, borderRadius: 16 }}
          onPress={() => setPage('Camera')}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Imbas QR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Camera Page
  if (page === 'Camera') {
    if (!hasPermission) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18 }}>Memerlukan kebenaran kamera</Text>
        </View>
      );
    }
    if (!device) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18 }}>Tiada kamera dikesan</Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
        {/* Overlay luar bingkai */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '25.5%', backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '47.5%', backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <View style={{ position: 'absolute', top: '25.5%', left: 0, width: '51%', height: 270.5, transform: [{ translateX: -140 }], backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <View style={{ position: 'absolute', top: '25.5%', right: 0, width: '51%', height: 270.5, transform: [{ translateX: 140 }], backgroundColor: 'rgba(0,0,0,0.3)' }} />

        {/* Bingkai kamera di tengah */}
        <View style={{ position: 'absolute', top: '25%', left: '50%', width: 280, height: 280, transform: [{ translateX: -140 }], justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12 }}>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#fff', borderTopLeftRadius: 7 }} />
          <View style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#fff', borderTopRightRadius: 7 }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#fff', borderBottomLeftRadius: 7 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#fff', borderBottomRightRadius: 7 }} />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>Tap to turn on flash</Text>
        </View>

        {/* Anak panah + Tajuk selari */}
        <View style={{ position: 'absolute', top: 40, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => setPage('Homepage')}>
            <Icon name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>DuitNow QR</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Butang Pay/Transfer & Receive */}
        <View style={{ position: 'absolute', top: 105, left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, padding: 10 }}>
            <TouchableOpacity style={{ backgroundColor: '#16bfb6', paddingVertical: 10, paddingHorizontal: 65, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Pay/Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 65, borderRadius: 6 }}>
              <Text style={{ color: '#333739', fontSize: 18, fontWeight: 'bold' }}>Receive</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Teks atas bingkai: Place QR in the scan area */}
        <View style={{ position: 'absolute', top: '20.5%', left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 15 }}>Place QR in the scan area</Text>
        </View>

        {/* Butang Scan from gallery */}
        <View style={{ position: 'absolute', top: '25%', left: 0, right: 0, alignItems: 'center', marginTop: 320 }}>
          <TouchableOpacity
            style={{ backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 55 }}
            onPress={scanQRFromGallery}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Scan from gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render Put Amount Page
  if (page === 'PutAmount') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
        <LinearGradient
          colors={['#797979', '#f7f7f7']}
          locations={[0, 0]}
          start={{ x: 0, y: 0.79 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0 }}
        />
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderColor: '#e2e2e2',
          overflow: 'hidden',
          padding: 24,
          zIndex: 1,
        }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20 }} onPress={() => setPage('Camera')}>
            <Icon name="close" size={28} color="#333739" />
          </TouchableOpacity>
          <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#333739' }}>DuitNow QR</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#333739' }}>Amount</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333739' }}>Amount</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#7c7d7f', borderRadius: 8, marginBottom: 32, paddingHorizontal: 12, backgroundColor: '#ffffff' }}>
            <Text style={{ fontSize: 18, color: '#333739', marginRight: 8 }}>MYR</Text>
            <TextInput
              style={{ flex: 1, fontSize: 18, paddingVertical: 10, color: '#333739', textAlign: 'right' }}
              placeholder="0.00"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => setAmount(formatAmountInput(text))}
            />
          </View>
          <TextInput
            style={{ backgroundColor: '#ffffff', color: '#333739', borderColor: '#7c7d7f', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 32 }}
            placeholder="Recipient Reference (Optional)"
            placeholderTextColor="#7c7d7f"
          />
          <TouchableOpacity
            style={{ backgroundColor: '#cc0001', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 'auto' }}
            onPress={() => {
              const numericAmount = parseFloat(amount);
              if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
                Alert.alert('Ralat', 'Sila masukkan jumlah yang sah');
                return;
              }
              setAmount(formatAmountOutput(amount));
              setPage('Approve');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render Approve Page
  if (page === 'Approve') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
        <LinearGradient
          colors={['#797979', '#f7f7f7']}
          locations={[0, 0]}
          start={{ x: 0, y: 0.79 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 }}
        />
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderColor: '#e2e2e2',
          overflow: 'hidden',
          padding: 24,
          justifyContent: 'space-between',
          zIndex: 1,
        }}>
          <View>
            <TouchableOpacity style={{ position: 'absolute', top: 40, left: 20 }} onPress={() => setPage('PutAmount')}>
              <Icon name="arrow-back" size={28} color="#333739" />
            </TouchableOpacity>
            <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20 }} onPress={() => setPage('Camera')}>
              <Icon name="close" size={28} color="#333739" />
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#333739' }}>Confirmation</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 4, color: '#333739' }}>Amount</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: '300', textAlign: 'center', color: '#333739' }}>MYR </Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333739' }}>{amount}</Text>
            </View>
            <View style={{ borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, color: '#333739' }}>To</Text>
              <Text style={{ fontSize: 16, color: '#333739', fontWeight: 'bold' }}>{name}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: '#333739' }}>From</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, color: '#333739', fontWeight: 'bold' }}>SAVERS ACCT-i</Text>
                <Text style={{ fontSize: 16, color: '#333739', fontWeight: 'bold' }}>7636717112</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#eeeeee', borderRadius: 10, padding: 14, marginBottom: 18 }}>
              <Text style={{ color: '#333739', fontSize: 14 }}>
                Note{`\n`}For Non-Residents, if you wish to transfer above the limit (RM10,000), please visit any CIMB branch and bring along supporting documents to show the purpose of the transfer (e.g., Invoice) allowable under the Foreign Exchange Policy Notice.{`\n`}Or, if your transfer exceeds the limit (RM10,000) for Scheduled Transfer, the transaction will not be processed on your scheduled date.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                <Text style={{ color: '#333739', fontSize: 14 }}>For more info, refer to our FAQ </Text>
                <Text style={{ color: '#00A3AD', textDecorationLine: 'underline', fontSize: 14 }}>here</Text>
              </View>
            </View>
          </View>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#eeeeee', borderRadius: 10, padding: 14, marginBottom: 24 }}>
              <Text style={{ color: '#333739', fontWeight: 'bold', fontSize: 16 }}>Total Amount</Text>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ color: '#333739', fontWeight: '300', fontSize: 16 }}>MYR </Text>
                <Text style={{ color: '#333739', fontWeight: 'bold', fontSize: 16 }}>{amount}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#cc0001', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={() => {
                const refNum = generateReferenceNumber();
                setReferenceNumber(refNum);
                setTransactionTime(currentTime);
                saveTransaction(name, formatAmountOutput(amount), currentTime);
                setPage('Output');
              }}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Approve via SecureTAC</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Render Output Page
  if (page === 'Output') {
    return (
      <LinearGradient
        colors={['#797979', '#f7f7f7']}
        locations={[0, 0]}
        start={{ x: 0, y: 0.79 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, zIndex: 1 }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: '#e2e2e2',
            overflow: 'hidden',
            padding: 24,
            justifyContent: 'space-between',
            zIndex: 2,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Image
              source={require('./screenshots/centeng.png')}
              style={{ width: 120, height: 120, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#37B37F', textAlign: 'center', marginBottom: 10 }}>Successful</Text>
            <Text style={{ fontSize: 18, color: '#333739', textAlign: 'center', marginBottom: 2 }}>Transaction Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 5 }}>
              <Text style={{ fontSize: 33, fontWeight: '300', color: '#333739', textAlign: 'center' }}>MYR </Text>
              <Text style={{ fontSize: 33, fontWeight: 'bold', color: '#333739', textAlign: 'center' }}>{amount}</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#333739', textAlign: 'center', marginBottom: 30 }}>{transactionTime}</Text>
            <View style={{ borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 29, width: '100%' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, width: '100%' }}>
              <Text style={{ fontSize: 16, color: '#333739' }}>OCTO Reference No.</Text>
              <Text style={{ fontSize: 16, color: '#333739', fontWeight: 'bold' }}>{referenceNumber}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, width: '100%' }}>
              <Text style={{ fontSize: 16, color: '#333739' }}>To</Text>
              <Text style={{ fontSize: 16, color: '#333739', fontWeight: 'bold' }}>{name}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, width: '100%' }}>
              <Text style={{ fontSize: 16, color: '#333739' }}>From</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, color: '#333739', fontWeight: 'bold' }}>YOUTH SAVERS ACCT-i</Text>
                <Text style={{ fontSize: 16, color: '#333739', fontWeight: 'bold' }}>7636717112</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
          <LinearGradient
            colors={['#dcdcdc', 'rgba(226,226,226,0.0)']}
            locations={[0, 0.5]}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 0, y: 0 }}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 320, zIndex: 2 }}
            pointerEvents="none"
          />
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 18,
            paddingBottom: 32,
            paddingHorizontal: 24,
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 1,
            shadowRadius: 16,
            elevation: 40,
            zIndex: 3,
          }}>
            <TouchableOpacity
              style={{ backgroundColor: '#FFFFFF', borderRadius: 20, width: 25, height: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e2e2e2', marginBottom: 16, position: 'relative' }}
            >
              <Icon name="keyboard-arrow-up" size={30} color="#333739" style={{ position: 'absolute', top: -5, left: -4, transform: [{ translateX: 0 }, { translateY: 0 }] }} />
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#16bfb6', borderRadius: 32, width: 56, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Icon name="share" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#cc0001', borderRadius: 12, paddingVertical: 16, width: '100%', alignItems: 'center' }}
              onPress={() => {
                setQrData('');
                setName('');
                setAmount('0.00');
                setReferenceNumber('');
                setTransactionTime('');
                setPage('Homepage');
              }}
            >
              <Text style={{ color: '#fff', fontSize: 25, fontWeight: 'bold' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Default fallback UI
  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7f7', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, color: '#333739' }}>Ralat: Halaman tidak ditemui ({page})</Text>
    </View>
  );
};

const requestGalleryPermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      // Android 13 ke atas
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'Kebenaran Galeri',
          message: 'Aplikasi memerlukan akses ke galeri untuk memilih gambar QR.',
          buttonNeutral: 'Nanti',
          buttonNegative: 'Tolak',
          buttonPositive: 'Benarkan',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // Android 12 ke bawah
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Kebenaran Galeri',
          message: 'Aplikasi memerlukan akses ke galeri untuk memilih gambar QR.',
          buttonNeutral: 'Nanti',
          buttonNegative: 'Tolak',
          buttonPositive: 'Benarkan',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true;
};

export default App;