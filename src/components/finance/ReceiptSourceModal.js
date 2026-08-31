import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useAi } from '../../stores/aiStore';
import { scanReceiptWithGemini } from '../../services/receiptScanner';
import { sendLocalNotification } from '../../services/notificationService';

export const ReceiptSourceModal = ({
  visible,
  onClose,
  onReceiptScanned,
  onNavigateSettings,
  onScanStarted,
  onScanError,
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { geminiApiKey, hasApiKey } = useAi();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [alertConfig, setAlertConfig] = useState(null);

  const resetModal = () => {
    setIsProcessing(false);
    setProcessingStatus('');
    setAlertConfig(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const checkApiKeyGuard = () => {
    if (!hasApiKey) {
      setAlertConfig({
        title: isIndonesian ? 'API Key Belum Diatur' : 'API Key Required',
        message: isIndonesian
          ? 'Untuk memindai struk dengan AI, Anda perlu memasukkan Google Gemini API Key di menu Pengaturan.'
          : 'To scan receipts with AI, please configure your free Google Gemini API key in Settings.',
        type: 'warning',
        confirmText: isIndonesian ? 'Buka Pengaturan' : 'Go to Settings',
        showCancel: true,
        cancelText: isIndonesian ? 'Batal' : 'Cancel',
        onConfirm: () => {
          setAlertConfig(null);
          handleClose();
          if (typeof onNavigateSettings === 'function') {
            onNavigateSettings();
          }
        },
        onCancel: () => setAlertConfig(null),
      });
      return false;
    }
    return true;
  };

  // Process image / file data with Gemini AI
  const processReceiptMedia = async (imageUri) => {
    setIsProcessing(true);
    const statusMsg = isIndonesian ? 'Menganalisis struk dengan Gemini AI...' : 'Analyzing receipt with Gemini AI...';
    setProcessingStatus(statusMsg);

    if (typeof onScanStarted === 'function') {
      onScanStarted({ method: 'ai', imageUri, statusMsg });
    }

    try {
      const extractedData = await scanReceiptWithGemini(imageUri, geminiApiKey);

      setIsProcessing(false);
      handleClose();

      // Trigger local Push Notification to phone
      await sendLocalNotification({
        title: isIndonesian ? 'Struk Belanja Berhasil Di-scan!' : 'Receipt Successfully Scanned!',
        body: `${extractedData.merchant || 'Struk Belanja'} • Total Rp ${(extractedData.totalAmount || 0).toLocaleString('id-ID')}. Ketuk untuk melihat detail.`,
        data: { type: 'receipt_scanned', merchant: extractedData.merchant },
      });

      if (typeof onReceiptScanned === 'function') {
        onReceiptScanned(extractedData, imageUri);
      }
    } catch (err) {
      console.log('Error scanning receipt with AI:', err);
      setIsProcessing(false);

      // Trigger local Push Notification on error
      await sendLocalNotification({
        title: isIndonesian ? '❌ Pemindaian Struk Gagal' : '❌ Receipt Scanning Failed',
        body: err.message || (isIndonesian ? 'Terjadi kesalahan saat memproses gambar.' : 'Error processing receipt image.'),
        data: { type: 'receipt_error' },
      });

      if (typeof onScanError === 'function') {
        onScanError(err);
      } else {
        setAlertConfig({
          title: isIndonesian ? 'Gagal Membaca Struk' : 'Scan Failed',
          message: err.message || (isIndonesian ? 'Terjadi kesalahan saat memproses gambar.' : 'Error processing receipt image.'),
          type: 'danger',
          confirmText: isIndonesian ? 'Coba Lagi' : 'Try Again',
          showCancel: false,
          onConfirm: () => setAlertConfig(null),
        });
      }
    }
  };

  // Source Option 1: Camera
  const handleLaunchCamera = async () => {
    if (!checkApiKeyGuard()) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig({
          title: isIndonesian ? 'Izin Kamera Dibutuhkan' : 'Camera Permission Required',
          message: isIndonesian ? 'Mohon izinkan akses kamera untuk memotret struk.' : 'Please allow camera access to take receipt photos.',
          type: 'danger',
          showCancel: false,
          confirmText: 'OK',
          onConfirm: () => setAlertConfig(null),
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await processReceiptMedia(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Camera error:', err);
      setAlertConfig({
        title: isIndonesian ? 'Gagal Membuka Kamera' : 'Camera Error',
        message: err.message,
        type: 'danger',
        showCancel: false,
        confirmText: 'OK',
        onConfirm: () => setAlertConfig(null),
      });
    }
  };

  // Source Option 2: Gallery
  const handleLaunchGallery = async () => {
    if (!checkApiKeyGuard()) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig({
          title: isIndonesian ? 'Izin Galeri Dibutuhkan' : 'Gallery Permission Required',
          message: isIndonesian ? 'Mohon izinkan akses galeri untuk memilih foto struk.' : 'Please allow gallery access to select receipt photos.',
          type: 'danger',
          showCancel: false,
          confirmText: 'OK',
          onConfirm: () => setAlertConfig(null),
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await processReceiptMedia(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Gallery error:', err);
      setAlertConfig({
        title: isIndonesian ? 'Gagal Membuka Galeri' : 'Gallery Error',
        message: err.message,
        type: 'danger',
        showCancel: false,
        confirmText: 'OK',
        onConfirm: () => setAlertConfig(null),
      });
    }
  };

  // Source Option 3: Document File (PDF or Image)
  const handleLaunchDocument = async () => {
    if (!checkApiKeyGuard()) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const file = result.assets[0];
        await processReceiptMedia(file.uri);
      }
    } catch (err) {
      console.log('Document picker error:', err);
      setAlertConfig({
        title: isIndonesian ? 'Gagal Membuka Dokumen' : 'Document Error',
        message: err.message,
        type: 'danger',
        showCancel: false,
        confirmText: 'OK',
        onConfirm: () => setAlertConfig(null),
      });
    }
  };

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={handleClose}
        title={t('receipt.modalTitle') || 'Input via Struk'}
        subtitle={t('receipt.chooseSource') || 'PILIH SUMBER STRUK :'}
      >
        <View style={styles.modalContent}>
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <View style={[styles.loadingCircle, { backgroundColor: (colors.accent || '#8B5CF6') + '20', borderColor: colors.accent || '#8B5CF6' }]}>
                <ActivityIndicator size="large" color={colors.accent || '#8B5CF6'} />
              </View>
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {processingStatus}
              </Text>

              <View style={[styles.bgInfoBox, { backgroundColor: (colors.accent || '#8B5CF6') + '15', borderColor: (colors.accent || '#8B5CF6') + '35' }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.accent || '#8B5CF6'} />
                <Text style={[styles.bgInfoText, { color: colors.text }]}>
                  {isIndonesian
                    ? 'Proses dapat ditinggalkan atau di-minimize. Kami akan mengirimkan notifikasi saat pemindaian selesai!'
                    : 'Process can run in background. A push notification will be sent when complete!'}
                </Text>
              </View>

              <View style={styles.bgRunBtnWrapper}>
                <NeoButton
                  title={isIndonesian ? 'Tutup & Biarkan Berjalan' : 'Run in Background'}
                  variant="secondary"
                  size="sm"
                  iconName="open-outline"
                  onPress={handleClose}
                />
              </View>
            </View>
          ) : (
            <View style={styles.optionsList}>
              {/* Source 1: Camera */}
              <NeoCard
                pressable
                onPress={handleLaunchCamera}
                backgroundColor={colors.card}
                style={[styles.sourceCard, { borderColor: colors.border }]}
              >
                <View style={styles.sourceRow}>
                  <View style={[styles.iconWrapperSmall, { backgroundColor: '#10B981', borderColor: colors.border }]}>
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.sourceTextCol}>
                    <Text style={[styles.sourceTitle, { color: colors.text }]}>
                      {t('receipt.sourceCamera') || 'Buka Kamera (Foto Langsung)'}
                    </Text>
                    <Text style={[styles.sourceDesc, { color: colors.textSecondary }]}>
                      {isIndonesian ? 'Potret langsung nota/struk fisik' : 'Take a photo of paper receipt'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </NeoCard>

              {/* Source 2: Gallery */}
              <NeoCard
                pressable
                onPress={handleLaunchGallery}
                backgroundColor={colors.card}
                style={[styles.sourceCard, { borderColor: colors.border }]}
              >
                <View style={styles.sourceRow}>
                  <View style={[styles.iconWrapperSmall, { backgroundColor: '#F59E0B', borderColor: colors.border }]}>
                    <Ionicons name="images" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.sourceTextCol}>
                    <Text style={[styles.sourceTitle, { color: colors.text }]}>
                      {t('receipt.sourceGallery') || 'Pilih dari Galeri Foto'}
                    </Text>
                    <Text style={[styles.sourceDesc, { color: colors.textSecondary }]}>
                      {isIndonesian ? 'Ambil screenshot atau foto di galeri' : 'Pick screenshot or saved receipt'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </NeoCard>

              {/* Source 3: Document File */}
              <NeoCard
                pressable
                onPress={handleLaunchDocument}
                backgroundColor={colors.card}
                style={[styles.sourceCard, { borderColor: colors.border }]}
              >
                <View style={styles.sourceRow}>
                  <View style={[styles.iconWrapperSmall, { backgroundColor: '#6366F1', borderColor: colors.border }]}>
                    <Ionicons name="document-text" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.sourceTextCol}>
                    <Text style={[styles.sourceTitle, { color: colors.text }]}>
                      {t('receipt.sourceDocument') || 'Upload File / Dokumen'}
                    </Text>
                    <Text style={[styles.sourceDesc, { color: colors.textSecondary }]}>
                      {isIndonesian ? 'File PDF invoice atau file gambar' : 'PDF invoice or receipt file'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </NeoCard>
            </View>
          )}
        </View>
      </NeoModal>

      {/* Confirmation & Error Alert Dialog */}
      {alertConfig && (
        <ConfirmModal
          visible={Boolean(alertConfig)}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type || 'info'}
          confirmText={alertConfig.confirmText || 'OK'}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel !== false}
          onConfirm={alertConfig.onConfirm}
          onCancel={alertConfig.onCancel || (() => setAlertConfig(null))}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    paddingVertical: 4,
  },
  optionsList: {
    gap: 10,
  },
  sourceCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapperSmall: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTextCol: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  sourceDesc: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  bgInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 14,
  },
  bgInfoText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  bgRunBtnWrapper: {
    width: '100%',
  },
});
