import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../theme/typography';
import { NeoCard } from '../components/neo/NeoCard';
import { NeoButton } from '../components/neo/NeoButton';
import { ConfirmModal } from '../components/neo/ConfirmModal';
import { useTheme } from '../stores/themeStore';
import { useLanguage } from '../stores/languageStore';
import { useQuran } from '../stores/quranStore';
import { useFinance } from '../stores/financeStore';
import { exportTransactionsToExcel } from '../services/excelExport';
import { ReminderModal } from '../components/quran/ReminderModal';
import { ImportModal } from '../components/finance/ImportModal';
import { GoogleSyncCard } from '../components/sync/GoogleSyncCard';
import { GeminiAiCard } from '../components/settings/GeminiAiCard';
import { APP_INFO } from '../constants/appInfo';

export const SettingsScreen = React.memo(({ onNavigateTab }) => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
  const { colors, currentThemeId, setTheme, availableThemes } = useTheme();
  const { currentLanguage, setLanguage, availableLanguages, t, isIndonesian } = useLanguage();
  const { clearHistory, history } = useQuran();
  const { clearAllTransactions, transactions, summary } = useFinance();
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { visible, title, message, type, confirmText, onConfirm }

  const showToast = (msg, icon = 'checkmark-circle') => {
    const toastObj = typeof msg === 'string' ? { text: msg, icon } : msg;
    setToastMessage(toastObj);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectLanguage = (langId) => {
    setLanguage(langId);
    showToast(
      langId === 'en'
        ? 'Language switched to English'
        : 'Bahasa diubah ke Bahasa Indonesia',
      'language-outline'
    );
  };

  const handleSelectTheme = (theme) => {
    setTheme(theme.id);
    showToast(
      isIndonesian
        ? `Tema "${theme.name}" diterapkan`
        : `Theme "${theme.name}" applied`,
      'color-palette-outline'
    );
  };

  const handleClearHistoryPrompt = () => {
    setConfirmDialog({
      title: isIndonesian ? 'Hapus Riwayat Ayat' : 'Clear Ayah History',
      message: isIndonesian
        ? 'Semua riwayat bacaan ayat harian akan dihapus permanen. Lanjutkan?'
        : 'All daily ayah reading history will be permanently deleted. Continue?',
      type: 'danger',
      confirmText: isIndonesian ? 'Hapus' : 'Delete',
      cancelText: isIndonesian ? 'Batal' : 'Cancel',
      onConfirm: async () => {
        await clearHistory();
        setConfirmDialog(null);
        showToast(
          isIndonesian
            ? 'Riwayat ayat berhasil dibersihkan'
            : 'Ayah history cleared successfully'
        );
      },
    });
  };

  const handleClearFinancePrompt = () => {
    setConfirmDialog({
      title: isIndonesian ? 'Reset Data Keuangan' : 'Reset Financial Data',
      message: isIndonesian
        ? 'PERINGATAN: Semua catatan transaksi keuangan akan dihapus permanen! Tindakan ini tidak dapat dibatalkan.'
        : 'WARNING: All financial transaction records will be permanently deleted! This action cannot be undone.',
      type: 'danger',
      confirmText: isIndonesian ? 'Reset Semua Data' : 'Reset All Data',
      cancelText: isIndonesian ? 'Batal' : 'Cancel',
      onConfirm: async () => {
        await clearAllTransactions();
        setConfirmDialog(null);
        showToast(
          isIndonesian
            ? 'Semua data keuangan telah direset'
            : 'All financial data has been reset'
        );
      },
    });
  };

  const handleExportFull = async () => {
    if (transactions.length === 0) {
      setConfirmDialog({
        title: isIndonesian ? 'Tidak Ada Data' : 'No Data Available',
        message: isIndonesian
          ? 'Belum ada transaksi keuangan untuk diekspor ke Excel.'
          : 'There are no financial transactions to export.',
        type: 'info',
        showCancel: false,
        confirmText: isIndonesian ? 'Mengerti' : 'Understood',
        onConfirm: () => setConfirmDialog(null),
      });
      return;
    }

    setExporting(true);
    const res = await exportTransactionsToExcel(transactions, summary);
    setExporting(false);

    if (res.success) {
      setConfirmDialog({
        title: isIndonesian ? 'Ekspor Berhasil' : 'Export Successful',
        message: isIndonesian
          ? `Laporan Excel (${res.fileName}) telah selesai dibuat dan siap disimpan / dibagikan.`
          : `Excel report (${res.fileName}) has been successfully generated.`,
        type: 'success',
        showCancel: false,
        confirmText: isIndonesian ? 'Selesai' : 'Done',
        onConfirm: () => setConfirmDialog(null),
      });
    } else {
      setConfirmDialog({
        title: isIndonesian ? 'Gagal Ekspor' : 'Export Failed',
        message: res.error || (isIndonesian ? 'Terjadi kesalahan saat mengekspor data.' : 'An error occurred during export.'),
        type: 'danger',
        showCancel: false,
        confirmText: isIndonesian ? 'Tutup' : 'Close',
        onConfirm: () => setConfirmDialog(null),
      });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isTablet ? 24 : 16,
            maxWidth: isTablet ? 1280 : '100%',
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple App Name Header */}
        <View style={styles.appHeaderRow}>
          <Text style={[styles.appNameText, { color: colors.text }]}>
            DalAy
          </Text>
          <View
            style={[
              styles.appVersionTag,
              { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight },
            ]}
          >
            <Text style={[styles.appVersionText, { color: colors.textSecondary }]}>
              v{APP_INFO.version}
            </Text>
          </View>
        </View>

        {/* Floating Toast Feedback */}
        {toastMessage && (
          <View
            style={[
              styles.toastBox,
              { backgroundColor: colors.primary, borderColor: colors.primaryDark },
            ]}
          >
            <Ionicons
              name={toastMessage.icon || 'checkmark-circle'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.toastText}>{toastMessage.text}</Text>
          </View>
        )}

        {/* App Profile & Version Card */}
        <NeoCard variant="white" padding={16} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.appIconBox,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="book" size={26} color={colors.primary} />
            </View>
            <View style={styles.appInfo}>
              <Text style={[styles.appName, { color: colors.text }]}>
                {t('settings.appProfile', 'DalAy (Daily Ayah & Smart Finance)')}
              </Text>
              <View
                style={[
                  styles.versionBadge,
                  {
                    backgroundColor: colors.incomeLight,
                    borderColor: colors.incomeBorder,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color={colors.incomeDark}
                />
                <Text
                  style={[styles.versionText, { color: colors.incomeDark }]}
                >
                  {APP_INFO.getVersionBadgeText(isIndonesian)}
                </Text>
              </View>
            </View>
          </View>
        </NeoCard>

        {/* Language Selector Section */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="language-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t('settings.languageSection', 'BAHASA APLIKASI')}
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {t(
            'settings.languageSectionSub',
            'Pilih bahasa tampilan yang Anda inginkan'
          )}
        </Text>

        <View style={styles.languageGrid}>
          {availableLanguages.map((lang) => {
            const isSelected = currentLanguage === lang.id;

            return (
              <Pressable
                key={lang.id}
                onPress={() => handleSelectLanguage(lang.id)}
                style={({ pressed }) => [
                  styles.langCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                  isSelected && [
                    styles.langCardSelected,
                    { backgroundColor: colors.primarySurface },
                  ],
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.langLeft}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <View style={styles.langTexts}>
                    <Text
                      style={[
                        styles.langName,
                        {
                          color: isSelected ? colors.primaryDark : colors.text,
                          fontWeight: isSelected ? '800' : '700',
                        },
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.langSub,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {lang.name} • {lang.description}
                    </Text>
                  </View>
                </View>

                {isSelected ? (
                  <View
                    style={[
                      styles.langActiveBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.inactiveRadio,
                      { borderColor: colors.border },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Interactive Theme Selector */}
        <View style={styles.sectionTitleRow}>
          <Ionicons
            name="color-palette-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t('settings.themeSection', 'PILIHAN TEMA APLIKASI')}
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {t(
            'settings.themeSectionSub',
            'Pilih palet warna dinamis & mode gelap OLED'
          )}
        </Text>

        <View style={styles.themesGrid}>
          {availableThemes.map((theme) => {
            const isSelected = currentThemeId === theme.id;

            return (
              <Pressable
                key={theme.id}
                onPress={() => handleSelectTheme(theme)}
                style={({ pressed }) => [
                  styles.themeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                  isSelected && styles.themeCardSelected,
                  pressed && styles.themeCardPressed,
                ]}
              >
                <View style={styles.themeCardTop}>
                  <View style={styles.themeHeaderLeft}>
                    <View
                      style={[
                        styles.themeIconBox,
                        { backgroundColor: theme.previewPrimary + '20' },
                      ]}
                    >
                      <Ionicons
                        name={theme.iconName || 'color-palette'}
                        size={18}
                        color={theme.previewPrimary}
                      />
                    </View>
                    <View style={styles.themeTexts}>
                      <Text style={[styles.themeName, { color: colors.text }]}>
                        {theme.name}
                      </Text>
                      <Text
                        style={[
                          styles.themeSubtitle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {theme.subtitle}
                      </Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: theme.previewPrimary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      <Text style={styles.activeBadgeText}>
                        {currentLanguage === 'en' ? 'Active' : 'Aktif'}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.inactiveRadio,
                        { borderColor: colors.border },
                      ]}
                    />
                  )}
                </View>

                {/* Color Swatch Preview Bar */}
                <View style={styles.swatchRow}>
                  <View style={styles.swatchItem}>
                    <View
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: theme.previewPrimary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.swatchLabel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Primary
                    </Text>
                  </View>
                  <View style={styles.swatchItem}>
                    <View
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: theme.previewSurface },
                      ]}
                    />
                    <Text
                      style={[
                        styles.swatchLabel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Card
                    </Text>
                  </View>
                  <View style={styles.swatchItem}>
                    <View
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: theme.previewBg },
                      ]}
                    />
                    <Text
                      style={[
                        styles.swatchLabel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Bg
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Daily Reminder Setting */}
        <View style={styles.sectionTitleRow}>
          <Ionicons
            name="notifications-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t('settings.reminderSection', 'PENGINGAT AYAT HARIAN')}
          </Text>
        </View>

        <NeoCard variant="white" padding={14} style={styles.actionCard}>
          <View style={styles.actionCardRow}>
            <View style={styles.actionCardTexts}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {t('reminder.title', 'Pengingat Terjadwal')}
              </Text>
            </View>
            <NeoButton
              title={t('settings.reminderSettingsBtn', 'Atur Pengingat')}
              iconName="time-outline"
              variant="accent"
              size="sm"
              onPress={() => setReminderModalVisible(true)}
            />
          </View>
        </NeoCard>

        {/* Cloud Sync & Recovery (Google Drive) */}
        <View style={styles.sectionTitleRow}>
          <Ionicons
            name="cloud-done-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {isIndonesian ? 'SINKRONISASI CLOUD (GOOGLE DRIVE)' : 'CLOUD SYNC (GOOGLE DRIVE)'}
          </Text>
        </View>

        <GoogleSyncCard onToast={showToast} />

        {/* Gemini AI Settings Section */}
        <View style={styles.sectionTitleRow}>
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t('settings.aiSection', 'GOOGLE GEMINI AI')}
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {t(
            'settings.aiSectionSub',
            'Konfigurasi token untuk scan struk belanja pintar dengan AI Vision'
          )}
        </Text>

        <GeminiAiCard onToast={showToast} />

        {/* Data & Storage Management */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="server-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t('settings.dataSection', 'DATA & PENYIMPANAN')}
          </Text>
        </View>

        <NeoCard variant="white" padding={14} style={styles.actionCard}>
          {/* Import Excel / CSV */}
          <View style={styles.actionItem}>
            <View style={styles.actionTexts}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {isIndonesian ? 'Impor Data Transaksi (.xlsx / .csv)' : 'Import Transactions (.xlsx / .csv)'}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                {isIndonesian
                  ? 'Unggah dan masukkan catatan transaksi dari file spreadsheet Excel.'
                  : 'Upload and parse financial transactions from spreadsheet files.'}
              </Text>
            </View>
            <NeoButton
              title={isIndonesian ? 'Impor' : 'Import'}
              iconName="cloud-upload-outline"
              variant="primary"
              size="sm"
              onPress={() => setImportModalVisible(true)}
            />
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* Export full Excel */}
          <View style={styles.actionItem}>
            <View style={styles.actionTexts}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {t('settings.exportExcelBtn', 'Ekspor Rekap Keuangan (.xlsx)')}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                {t(
                  'settings.exportExcelDesc',
                  'Unduh seluruh riwayat transaksi ke dalam file spreadsheet Excel rapi.'
                )}
              </Text>
            </View>
            <NeoButton
              title={isIndonesian ? 'Ekspor' : 'Export'}
              iconName="download-outline"
              variant="income"
              size="sm"
              loading={exporting}
              onPress={handleExportFull}
            />
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* Clear History */}
          <View style={styles.actionItem}>
            <View style={styles.actionTexts}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {t('settings.clearHistoryBtn', 'Bersihkan Riwayat Bacaan')}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                {history.length} {isIndonesian ? 'ayat tersimpan di riwayat bacaan.' : 'ayats stored in reading history.'}
              </Text>
            </View>
            <NeoButton
              title={isIndonesian ? 'Bersihkan' : 'Clear'}
              iconName="trash-outline"
              variant="outline"
              size="sm"
              onPress={handleClearHistoryPrompt}
            />
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* Reset Finance */}
          <View style={styles.actionItem}>
            <View style={styles.actionTexts}>
              <Text style={[styles.actionTitle, { color: colors.expense }]}>
                {t('settings.clearFinanceBtn', 'Hapus Seluruh Data Keuangan')}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                {transactions.length} {isIndonesian ? 'catatan transaksi keuangan saat ini.' : 'current financial transaction records.'}
              </Text>
            </View>
            <NeoButton
              title={isIndonesian ? 'Reset' : 'Reset'}
              iconName="alert-circle-outline"
              variant="expense"
              size="sm"
              onPress={handleClearFinancePrompt}
            />
          </View>
        </NeoCard>

        {/* About App */}
        <NeoCard variant="accent" padding={14} style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <Ionicons name="heart" size={16} color={colors.primary} />
            <Text style={[styles.aboutTitle, { color: colors.primaryDark }]}>
              {t('settings.aboutSection', 'Tentang DalAy')}
            </Text>
          </View>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            {t(
              'settings.aboutText',
              'Aplikasi islami dan pencatat keuangan cerdas dengan sinkronisasi otomatis Google Drive.'
            )}
          </Text>
        </NeoCard>
      </ScrollView>

      {/* Reminder Modal */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
      />

      {/* Import Modal */}
      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={(count) => {
          showToast(
            isIndonesian
              ? `Berhasil mengimpor ${count} transaksi`
              : `Successfully imported ${count} transactions`,
            'cloud-download-outline'
          );
          setConfirmDialog({
            title: isIndonesian ? 'Impor Berhasil' : 'Import Successful',
            message: isIndonesian
              ? `Berhasil memasukkan ${count} catatan transaksi ke dalam pembukuan Anda.`
              : `Successfully imported ${count} transaction records into your financial bookkeeping.`,
            type: 'success',
            showCancel: false,
            confirmText: isIndonesian ? 'Selesai' : 'Done',
          });
        }}
      />

      {/* Modern Confirm / Alert Modal Dialog */}
      {confirmDialog && (
        <ConfirmModal
          visible={Boolean(confirmDialog)}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm || (() => setConfirmDialog(null))}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type || 'danger'}
          iconName={confirmDialog.iconName}
          confirmText={confirmDialog.confirmText}
          cancelText={isIndonesian ? 'Batal' : 'Cancel'}
          showCancel={confirmDialog.showCancel !== false}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  appHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  appNameText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    minWidth: 85,
    paddingRight: 14,
    paddingBottom: 2,
  },
  appVersionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  appVersionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '900',
  },
  appTagline: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 2,
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginBottom: 8,
    paddingLeft: 2,
  },
  languageGrid: {
    gap: 8,
    marginBottom: 14,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  langCardSelected: {
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  langFlag: {
    fontSize: 24,
  },
  langTexts: {
    flex: 1,
  },
  langName: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  langSub: {
    fontSize: 11,
    marginTop: 1,
  },
  langActiveBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themesGrid: {
    gap: 8,
    marginBottom: 14,
  },
  themeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  themeCardSelected: {
    borderWidth: 1.5,
  },
  themeCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  themeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  themeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTexts: {
    flex: 1,
  },
  themeName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  themeSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  inactiveRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  swatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  swatchCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  swatchLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionCard: {
    marginBottom: 14,
  },
  actionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCardTexts: {
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 4,
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  actionSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  aboutCard: {
    marginTop: 4,
    marginBottom: 16,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aboutTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  aboutText: {
    fontSize: TYPOGRAPHY.size.xs,
    lineHeight: 18,
  },
});

export default SettingsScreen;
