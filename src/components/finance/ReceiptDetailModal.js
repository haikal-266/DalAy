import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { CategoryIcon } from '../common/CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { formatRupiah, formatDateIndo, formatTimeIndo } from '../../utils/formatters';

export const ReceiptDetailModal = ({
  visible,
  onClose,
  transaction,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const [previewImageVisible, setPreviewImageVisible] = useState(false);

  if (!transaction) return null;

  const items = Array.isArray(transaction.items) ? transaction.items : [];
  const hasItems = items.length > 0;
  const imageUri = transaction.receiptUri;

  const handleEditPress = () => {
    onClose();
    if (typeof onEdit === 'function') {
      onEdit(transaction);
    }
  };

  const handleDeletePress = () => {
    onClose();
    if (typeof onDelete === 'function') {
      onDelete(transaction);
    }
  };

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={onClose}
        title={isIndonesian ? 'Rincian Struk Transaksi' : 'Receipt Transaction Details'}
        subtitle={isIndonesian ? 'Validasi item & bukti nota belanja' : 'Item breakdown & receipt validation'}
        footer={
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleDeletePress}
              style={[
                styles.iconBtn,
                { backgroundColor: (colors.expense || '#EF4444') + '15', borderColor: colors.expense || '#EF4444' },
              ]}
              hitSlop={6}
            >
              <Ionicons name="trash-outline" size={18} color={colors.expense || '#EF4444'} />
            </Pressable>

            <Pressable
              onPress={handleEditPress}
              style={[
                styles.iconBtn,
                { backgroundColor: (colors.accent || '#8B5CF6') + '15', borderColor: colors.accent || '#8B5CF6' },
              ]}
              hitSlop={6}
            >
              <Ionicons name="create-outline" size={18} color={colors.accent || '#8B5CF6'} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <NeoButton
                title={isIndonesian ? 'Tutup' : 'Close'}
                variant="primary"
                size="md"
                onPress={onClose}
              />
            </View>
          </View>
        }
      >
        <View style={styles.container}>
          {/* Top Merchant & Total Overview Card */}
          <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.merchantHeaderRow}>
              <CategoryIcon
                iconName={transaction.iconName || 'receipt'}
                iconFamily={transaction.iconFamily || 'Ionicons'}
                color={transaction.categoryColor || colors.primary}
                bgColor={transaction.categoryBgColor || (colors.primary + '15')}
                size={22}
                containerSize={44}
                borderRadius={12}
              />
              <View style={styles.merchantTextCol}>
                <Text style={[styles.merchantName, { color: colors.text }]} numberOfLines={1}>
                  {transaction.name || 'Struk Belanja'}
                </Text>
                <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                  {formatDateIndo(transaction.date, true)} • {formatTimeIndo(transaction.date)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            {/* Financial Summary */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'TOTAL AKHIR' : 'GRAND TOTAL'}
              </Text>
              <Text style={[styles.totalAmount, { color: colors.expense || '#EF4444' }]}>
                -{formatRupiah(transaction.amount)}
              </Text>
            </View>

            {/* Wallet & Category Badges */}
            <View style={styles.metaBadgesRow}>
              {Boolean(transaction.walletName) && (
                <View style={[styles.metaBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
                  <Ionicons name="wallet-outline" size={12} color={colors.primary} />
                  <Text style={[styles.metaBadgeText, { color: colors.primary }]}>
                    {transaction.walletName}
                  </Text>
                </View>
              )}
              {Boolean(transaction.categoryName) && (
                <View style={[styles.metaBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
                  <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>
                    {transaction.categoryName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Attached Receipt Photo Pill (if present) */}
          {Boolean(imageUri) && (
            <Pressable
              onPress={() => setPreviewImageVisible(true)}
              style={[styles.photoPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Image source={{ uri: imageUri }} style={styles.photoPillThumb} />
              <View style={styles.photoPillInfo}>
                <Text style={[styles.photoPillTitle, { color: colors.text }]}>
                  {isIndonesian ? 'Bukti Foto Struk Belanja' : 'Receipt Proof Photo'}
                </Text>
                <Text style={[styles.photoPillSubtitle, { color: colors.primary }]}>
                  {isIndonesian ? 'Ketuk untuk melihat foto ukuran penuh' : 'Tap to zoom full picture'}
                </Text>
              </View>
              <Ionicons name="expand-outline" size={18} color={colors.primary} />
            </Pressable>
          )}

          {/* Itemized Table Breakdown */}
          {hasItems && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'RINCIAN ITEM SATUAN :' : 'ITEMIZED BREAKDOWN :'}
                </Text>
                <View style={[styles.itemCountTag, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.itemCountTagText, { color: colors.primary }]}>
                    {items.length} {isIndonesian ? 'Item' : 'Items'}
                  </Text>
                </View>
              </View>

              <View style={[styles.itemsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {items.map((item, idx) => (
                  <View
                    key={item.name ? `${item.name}-${idx}` : `item-${idx}`}
                    style={[
                      styles.itemRow,
                      idx < items.length - 1 && {
                        borderBottomColor: colors.borderLight,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <View style={styles.itemIndexBadge}>
                      <Text style={[styles.itemIndexText, { color: colors.textSecondary }]}>
                        {idx + 1}
                      </Text>
                    </View>

                    <View style={styles.itemInfoCol}>
                      <Text style={[styles.itemName, { color: colors.text }]}>
                        {item.name || `Item ${idx + 1}`}
                      </Text>
                      <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                        Qty: {item.qty || 1} {item.price ? `@ ${formatRupiah(item.price)}` : ''}
                      </Text>
                    </View>

                    <Text style={[styles.itemSubtotal, { color: colors.text }]}>
                      {formatRupiah((item.price || 0) * (item.qty || 1))}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Notes (if any) */}
          {Boolean(transaction.notes) && (
            <View style={[styles.notesBox, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
              <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'Catatan Tambahan :' : 'Notes :'}
              </Text>
              <Text style={[styles.notesContent, { color: colors.text }]}>
                {transaction.notes}
              </Text>
            </View>
          )}
        </View>
      </NeoModal>

      {/* Fullscreen Zoom Image Modal */}
      <Modal
        visible={previewImageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageVisible(false)}
      >
        <View style={styles.fullImageBackdrop}>
          <Pressable style={styles.closeFullImageBtn} onPress={() => setPreviewImageVisible(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          {Boolean(imageUri) && (
            <Image
              source={{ uri: imageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 20,
  },
  overviewCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  merchantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  merchantTextCol: {
    flex: 1,
    gap: 2,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  transactionDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  photoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  photoPillThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#18181B',
  },
  photoPillInfo: {
    flex: 1,
  },
  photoPillTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  photoPillSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemCountTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  itemCountTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemsContainer: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  itemIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIndexText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemInfoCol: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
  },
  notesBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  notesContent: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImageBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closeFullImageBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
