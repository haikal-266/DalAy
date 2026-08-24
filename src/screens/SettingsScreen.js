import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { NeoCard } from '../components/neo/NeoCard';
import { NeoButton } from '../components/neo/NeoButton';
import { ReminderModal } from '../components/quran/ReminderModal';
import { useFinance } from '../stores/financeStore';
import { useQuran } from '../stores/quranStore';
import { useTheme } from '../stores/themeStore';

export const SettingsScreen = () => {
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const { clearAllTransactions, transactions } = useFinance();
  const { clearHistory, history, favorites } = useQuran();
  const { currentThemeId, setTheme, availableThemes, colors, isDark } = useTheme();

  const handleResetFinanceData = () => {
    Alert.alert(
      'Hapus Semua Data Keuangan',
      `Yakin ingin menghapus seluruh ${transactions.length} catatan transaksi? Tindakan ini akan mengembalikan saldo ke Rp 0.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            await clearAllTransactions();
            Alert.alert('Sukses', 'Semua data transaksi keuangan telah direset ke 0.');
          },
        },
      ]
    );
  };

  const handleResetQuranHistory = () => {
    Alert.alert(
      'Bersihkan Riwayat Bacaan',
      'Yakin ingin membersihkan riwayat ayat yang pernah dibuka?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Bersihkan',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            Alert.alert('Sukses', 'Riwayat ayat telah dibersihkan.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.logoRow}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="settings" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.headerLogo, { color: colors.text }]}>Pengaturan</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Tema Visual, Notifikasi & Manajemen Data
          </Text>
        </View>

        {/* App Profile Card */}
        <NeoCard variant="white" padding={16} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.appIconBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
              <Ionicons name="book" size={26} color={colors.primary} />
            </View>
            <View style={styles.appInfo}>
              <Text style={[styles.appName, { color: colors.text }]}>DalAy (Daily Ayah)</Text>
              <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
                Daily Quran Reminder & Smart Finance Tracker
              </Text>
              <View style={[styles.versionBadge, { backgroundColor: colors.incomeLight, borderColor: colors.incomeBorder }]}>
                <Ionicons name="shield-checkmark-outline" size={12} color={colors.incomeDark} />
                <Text style={[styles.versionText, { color: colors.incomeDark }]}>
                  Versi 1.0.0 • Offline First
                </Text>
              </View>
            </View>
          </View>
        </NeoCard>

        {/* Interactive Theme Selector */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="color-palette-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>PILIHAN TEMA APLIKASI</Text>
        </View>

        <View style={styles.themesGrid}>
          {availableThemes.map((theme) => {
            const isSelected = currentThemeId === theme.id;

            return (
              <Pressable
                key={theme.id}
                onPress={() => setTheme(theme.id)}
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
                      <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
                        {theme.subtitle}
                      </Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <View style={[styles.activeBadge, { backgroundColor: theme.previewPrimary }]}>
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      <Text style={styles.activeBadgeText}>Aktif</Text>
                    </View>
                  ) : (
                    <View style={[styles.inactiveRadio, { borderColor: colors.border }]} />
                  )}
                </View>

                {/* Color Swatch Preview Bar */}
                <View style={styles.swatchRow}>
                  <View style={styles.swatchItem}>
                    <View style={[styles.swatchCircle, { backgroundColor: theme.previewPrimary }]} />
                    <Text style={[styles.swatchLabel, { color: colors.textMuted }]}>Aksen</Text>
                  </View>
                  <View style={styles.swatchItem}>
                    <View
                      style={[
                        styles.swatchCircle,
                        {
                          backgroundColor: theme.previewBg,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                        },
                      ]}
                    />
                    <Text style={[styles.swatchLabel, { color: colors.textMuted }]}>Latar</Text>
                  </View>
                  <View style={styles.swatchItem}>
                    <View
                      style={[
                        styles.swatchCircle,
                        {
                          backgroundColor: theme.previewSurface,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                        },
                      ]}
                    />
                    <Text style={[styles.swatchLabel, { color: colors.textMuted }]}>Kartu</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Reminder Settings Card */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="notifications-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>NOTIFIKASI & JADWAL</Text>
        </View>

        <NeoCard variant="white" padding={14} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Pengingat Ayat Terjadwal</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                Atur frekuensi (1 jam, 2 jam, 4 jam, harian) & tes notifikasi ayat
              </Text>
            </View>
            <NeoButton
              title="Atur"
              iconName="time-outline"
              variant="accent"
              size="sm"
              onPress={() => setReminderModalVisible(true)}
            />
          </View>
        </NeoCard>

        {/* Data & Storage Management */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="server-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHeader, { color: colors.text }]}>MANAJEMEN DATA LOKAL</Text>
        </View>

        <NeoCard variant="white" padding={14} style={styles.card}>
          <View style={styles.dataRow}>
            <View style={styles.dataTextLeft}>
              <Text style={[styles.dataTitle, { color: colors.text }]}>Total Catatan Keuangan</Text>
              <Text style={[styles.dataDesc, { color: colors.textSecondary }]}>
                {transactions.length} transaksi tersimpan di perangkat
              </Text>
            </View>
            <NeoButton
              title="Reset ke 0"
              iconName="trash-outline"
              variant="expense"
              size="sm"
              onPress={handleResetFinanceData}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.dataRow}>
            <View style={styles.dataTextLeft}>
              <Text style={[styles.dataTitle, { color: colors.text }]}>Riwayat Bacaan Ayat</Text>
              <Text style={[styles.dataDesc, { color: colors.textSecondary }]}>
                {history.length} riwayat, {favorites.length} favorit
              </Text>
            </View>
            <NeoButton
              title="Bersihkan"
              iconName="refresh-outline"
              variant="secondary"
              size="sm"
              onPress={handleResetQuranHistory}
            />
          </View>
        </NeoCard>

        {/* About App */}
        <NeoCard variant="accent" padding={14} style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <Ionicons name="heart" size={16} color={colors.primary} />
            <Text style={[styles.aboutTitle, { color: colors.primaryDark }]}>Tentang DalAy</Text>
          </View>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Aplikasi islami dan pencatat keuangan harian dengan arsitektur offline-first, cepat, dan terorganisir.
          </Text>
        </NeoCard>
      </ScrollView>

      {/* Reminder Modal */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
      />
    </View>
  );
};

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
  header: {
    marginBottom: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 3,
    fontWeight: '500',
  },
  profileCard: {
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
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
    marginTop: 1,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 7,
    marginTop: 5,
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
    marginTop: 12,
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  themesGrid: {
    gap: 8,
    marginVertical: 4,
  },
  themeCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  themeCardSelected: {
    borderWidth: 2,
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
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
    gap: 3,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  swatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatchCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  swatchLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  card: {
    marginVertical: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dataTextLeft: {
    flex: 1,
    marginRight: 10,
  },
  dataTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
  },
  dataDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  aboutCard: {
    marginTop: 14,
    marginBottom: 10,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aboutTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  aboutText: {
    fontSize: 11,
    lineHeight: 18,
  },
});

export default SettingsScreen;
