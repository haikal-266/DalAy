import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoModal } from '../neo/NeoModal';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { ConfirmModal } from '../neo/ConfirmModal';
import { CategoryIcon } from '../common/CategoryIcon';
import { CategoryPickerModal } from '../common/CategoryPickerModal';
import { formatRupiah } from '../../utils/formatters';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useWallet } from '../../stores/walletStore';
import { useFinance } from '../../stores/financeStore';
import { useCategories } from '../../stores/categoryStore';

export const ReceiptReviewModal = ({
  visible,
  onClose,
  scannedData,
  imageUri,
  onSave,
  defaultWalletId,
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { wallets, getWalletBalance } = useWallet();
  const { transactions } = useFinance();
  const { expenseCategories, allCategories, getCategoryById } = useCategories();

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(expenseCategories[0]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [alertConfig, setAlertConfig] = useState(null);
  const [previewImageVisible, setPreviewImageVisible] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Edit / Add Item state
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [itemEditIndex, setItemEditIndex] = useState(null); // null means adding new item
  const [formItemName, setFormItemName] = useState('');
  const [formItemPrice, setFormItemPrice] = useState('');
  const [formItemQty, setFormItemQty] = useState('1');

  useEffect(() => {
    if (visible && scannedData) {
      setMerchant(scannedData.merchant || '');
      setAmount(
        scannedData.totalAmount ? formatRupiah(scannedData.totalAmount, true) : ''
      );
      setDate(scannedData.date || new Date().toISOString().split('T')[0]);

      // Category matching with custom categories
      const foundCat = expenseCategories.find(
        (c) => c.id === scannedData.categoryId
      );
      setSelectedCategory(foundCat || expenseCategories[0]);

      // Wallet matching
      const foundWallet =
        wallets.find((w) => w.id === defaultWalletId && w.id !== 'all') ||
        wallets[0];
      setSelectedWallet(foundWallet);

      setNotes(scannedData.notes || '');
      setItems(Array.isArray(scannedData.items) ? [...scannedData.items] : []);
    }
  }, [visible, scannedData, defaultWalletId, wallets, expenseCategories]);

  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + ((it.price || 0) * (it.qty || 1)), 0);
  }, [items]);

  const handleDeleteItem = (indexToDelete) => {
    setItems((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleOpenEditItem = (index) => {
    const it = items[index];
    setItemEditIndex(index);
    setFormItemName(it.name || '');
    setFormItemPrice(String(it.price || ''));
    setFormItemQty(String(it.qty || '1'));
    setItemModalVisible(true);
  };

  const handleOpenAddItem = () => {
    setItemEditIndex(null);
    setFormItemName('');
    setFormItemPrice('');
    setFormItemQty('1');
    setItemModalVisible(true);
  };

  const handleSaveItemForm = () => {
    if (!formItemName.trim()) {
      setAlertConfig({
        title: isIndonesian ? 'Nama Item Kosong' : 'Item Name Required',
        message: isIndonesian ? 'Silakan masukkan nama produk/item.' : 'Please enter item name.',
        type: 'warning',
      });
      return;
    }

    const cleanPrice = Number.parseInt(formItemPrice.replace(/\D/g, ''), 10) || 0;
    const cleanQty = Number.parseInt(formItemQty.replace(/\D/g, ''), 10) || 1;

    const newItemObj = {
      name: formItemName.trim(),
      price: cleanPrice,
      qty: cleanQty > 0 ? cleanQty : 1,
    };

    if (itemEditIndex !== null) {
      // Update existing item
      setItems((prev) => {
        const next = [...prev];
        next[itemEditIndex] = newItemObj;
        return next;
      });
    } else {
      // Add new item
      setItems((prev) => [...prev, newItemObj]);
    }

    setItemModalVisible(false);
  };

  const handleUseItemsSubtotal = () => {
    if (itemsSubtotal > 0) {
      setAmount(formatRupiah(itemsSubtotal, true));
    }
  };

  const handleConfirmSave = () => {
    const cleanAmount = Number.parseInt(amount.replace(/\D/g, ''), 10);

    if (!merchant.trim()) {
      setAlertConfig({
        title: isIndonesian ? 'Nama Toko Kosong' : 'Store Name Missing',
        message: isIndonesian
          ? 'Silakan isi nama toko atau tempat transaksi.'
          : 'Please enter store or merchant name.',
        type: 'warning',
      });
      return;
    }

    if (!cleanAmount || cleanAmount <= 0) {
      setAlertConfig({
        title: isIndonesian ? 'Nominal Belum Diisi' : 'Amount Missing',
        message: isIndonesian
          ? 'Silakan masukkan total nominal transaksi yang valid.'
          : 'Please enter a valid total transaction amount.',
        type: 'warning',
      });
      return;
    }

    if (!selectedWallet) {
      setAlertConfig({
        title: isIndonesian ? 'Pilih Dompet' : 'Select Wallet',
        message: isIndonesian
          ? 'Silakan pilih dompet pengeluaran untuk mencatat transaksi ini.'
          : 'Please select an expense wallet for this record.',
        type: 'warning',
      });
      return;
    }

    const parsedDate = date ? new Date(date) : new Date();
    const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const transactionData = {
      name: merchant.trim(),
      amount: cleanAmount,
      type: 'expense',
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      categoryColor: selectedCategory.color,
      categoryBgColor: selectedCategory.bgColor,
      iconName: selectedCategory.iconName,
      iconFamily: selectedCategory.iconFamily,
      walletId: selectedWallet.id,
      walletName: selectedWallet.name,
      walletIcon: selectedWallet.icon,
      date: validDate.toISOString(),
      notes: notes.trim(),
      receiptUri: imageUri || null,
      items: items.length > 0 ? items : undefined,
      isFromReceipt: true,
    };

    if (typeof onSave === 'function') {
      onSave(transactionData);
    }
    onClose();
  };

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={onClose}
        title={t('receipt.reviewTitle') || 'Review Data Struk'}
        subtitle={t('receipt.reviewSubtitle') || 'Periksa & koreksi data sebelum disimpan'}
        footer={
          <View style={styles.actionRow}>
            <View style={styles.actionCol}>
              <NeoButton
                title={t('modal.cancel') || 'Batal'}
                variant="outline"
                size="md"
                onPress={onClose}
              />
            </View>
            <View style={styles.actionColFlex}>
              <NeoButton
                title={t('receipt.saveTransaction') || 'Simpan Transaksi'}
                variant="primary"
                size="md"
                iconName="checkmark-circle"
                onPress={handleConfirmSave}
              />
            </View>
          </View>
        }
      >
        <View style={styles.container}>
          {/* Simple Minimalist Photo Pill */}
          {imageUri && (
            <Pressable
              onPress={() => setPreviewImageVisible(true)}
              style={[
                styles.photoPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Image source={{ uri: imageUri }} style={styles.photoPillThumb} />
              <View style={styles.photoPillInfo}>
                <Text style={[styles.photoPillTitle, { color: colors.text }]}>
                  {isIndonesian ? 'Foto Struk Terlampir' : 'Attached Receipt Photo'}
                </Text>
                <Text style={[styles.photoPillSubtitle, { color: colors.primary }]}>
                  {isIndonesian ? 'Ketuk untuk melihat foto nota' : 'Tap to view receipt picture'}
                </Text>
              </View>
              <Ionicons name="expand-outline" size={18} color={colors.primary} />
            </Pressable>
          )}

          {/* Merchant Input */}
          <View style={styles.inputGroup}>
            <NeoInput
              label={t('receipt.merchantLabel') || 'Nama Toko / Tempat'}
              value={merchant}
              onChangeText={setMerchant}
              placeholder={t('receipt.merchantPlaceholder') || 'cth: SALFORD & CO.'}
              leftIconName="business-outline"
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <NeoInput
              label={t('receipt.totalLabel') || 'Total Transaksi (Rp)'}
              value={amount}
              onChangeText={(val) => {
                const num = val.replace(/\D/g, '');
                setAmount(num ? formatRupiah(Number.parseInt(num, 10), true) : '');
              }}
              placeholder="Rp 0"
              keyboardType="numeric"
              leftIconName="cash-outline"
            />
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <NeoInput
              label={t('receipt.dateLabel') || 'Tanggal Transaksi'}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              leftIconName="calendar-outline"
            />
          </View>

          {/* Category Selector (Modern Button + CategoryPickerModal) */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('receipt.categoryLabel') || (isIndonesian ? 'KATEGORI PENGELUARAN :' : 'EXPENSE CATEGORY :')}
            </Text>
            <Pressable
              onPress={() => setIsCategoryModalOpen(true)}
              style={({ pressed }) => [
                styles.categoryPickerBtn,
                {
                  backgroundColor: (selectedCategory?.color || colors.primary) + '15',
                  borderColor: selectedCategory?.color || colors.primary,
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.catBtnLeft}>
                <CategoryIcon
                  iconName={selectedCategory?.iconName || selectedCategory?.icon || 'cube'}
                  iconFamily={selectedCategory?.iconFamily || 'Ionicons'}
                  color={selectedCategory?.color || colors.primary}
                  bgColor={(selectedCategory?.color || colors.primary) + '25'}
                  size={18}
                  containerSize={36}
                  borderRadius={10}
                />
                <View style={styles.catBtnTextCol}>
                  <Text style={[styles.catBtnName, { color: colors.text }]}>
                    {selectedCategory?.name || (isIndonesian ? 'Pilih Kategori' : 'Select Category')}
                  </Text>
                  <Text style={[styles.catBtnSub, { color: colors.textSecondary }]}>
                    {isIndonesian ? 'Ketuk untuk mengganti kategori' : 'Tap to change category'}
                  </Text>
                </View>
              </View>

              <View style={[styles.catChevronCircle, { backgroundColor: colors.surface }]}>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>

            <CategoryPickerModal
              visible={isCategoryModalOpen}
              onClose={() => setIsCategoryModalOpen(false)}
              selectedCategoryId={selectedCategory?.id}
              onSelectCategory={(catId) => {
                const found =
                  expenseCategories.find((c) => c.id === catId) ||
                  allCategories?.find((c) => c.id === catId) ||
                  (getCategoryById && getCategoryById(catId, 'expense'));
                if (found) setSelectedCategory(found);
              }}
              typeFilter="expense"
              allowAll={false}
            />
          </View>

          {/* Wallet Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('receipt.walletLabel') || 'SIMPAN KE DOMPET :'}
            </Text>
            <View style={styles.walletGrid2Col}>
              {wallets.map((w) => {
                const isSelected = selectedWallet?.id === w.id;
                const stats = getWalletBalance ? getWalletBalance(w.id, transactions) : { balance: 0 };
                const liveBalance = typeof stats === 'number' ? stats : (stats?.balance ?? 0);

                return (
                  <Pressable
                    key={w.id}
                    onPress={() => setSelectedWallet(w)}
                    style={[
                      styles.walletItem2Col,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.walletItemHeader}>
                      <Ionicons
                        name={w.icon || 'wallet'}
                        size={16}
                        color={isSelected ? '#FFFFFF' : colors.primary}
                      />
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.walletItemName,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {w.name}
                    </Text>
                    <Text
                      style={[
                        styles.walletItemBalance,
                        {
                          color: isSelected
                            ? '#FFFFFFE0'
                            : colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatRupiah(liveBalance)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Detected & Editable Items Section */}
          <View style={styles.section}>
            <View style={styles.itemsHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('receipt.itemsBreakdown') || 'RINCIAN ITEM BELANJA :'}
              </Text>
              <Pressable
                onPress={handleOpenAddItem}
                style={[styles.addItemBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
              >
                <Ionicons name="add" size={13} color={colors.primary} />
                <Text style={[styles.addItemBtnText, { color: colors.primary }]}>
                  {isIndonesian ? 'Tambah Item' : 'Add Item'}
                </Text>
              </Pressable>
            </View>

            {items.length > 0 ? (
              <View style={[styles.itemsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {items.map((item, index) => (
                  <View
                    key={item.name ? `${item.name}-${index}` : `item-${index}`}
                    style={[
                      styles.itemRow,
                      index < items.length - 1 && {
                        borderBottomColor: colors.borderLight || '#E2E8F0',
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    {/* Item Name & Details */}
                    <View style={styles.itemNameCol}>
                      <Text style={[styles.itemNameText, { color: colors.text }]} numberOfLines={1}>
                        {item.name || `Item ${index + 1}`}
                      </Text>
                      <Text style={[styles.itemQtyText, { color: colors.textSecondary }]}>
                        Qty: {item.qty || 1} {item.price ? `@ ${formatRupiah(item.price)}` : ''}
                      </Text>
                    </View>

                    {/* Price & Action Buttons */}
                    <View style={styles.itemRightRow}>
                      <Text style={[styles.itemPriceText, { color: colors.text }]}>
                        {formatRupiah((item.price || 0) * (item.qty || 1))}
                      </Text>

                      {/* Edit button */}
                      <Pressable
                        onPress={() => handleOpenEditItem(index)}
                        style={[styles.itemActionBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}
                        hitSlop={6}
                      >
                        <Ionicons name="create-outline" size={14} color={colors.primary} />
                      </Pressable>

                      {/* Delete Cross button */}
                      <Pressable
                        onPress={() => handleDeleteItem(index)}
                        style={[styles.itemActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                        hitSlop={6}
                      >
                        <Ionicons name="close" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}

                {/* Subtotal & Sync Total Bar */}
                <View style={[styles.itemsFooterRow, { borderTopColor: colors.borderLight, backgroundColor: colors.surfaceLight }]}>
                  <View style={styles.subtotalTextCol}>
                    <Text style={[styles.subtotalLabel, { color: colors.textSecondary }]}>
                      {isIndonesian ? 'Total Hitungan Item:' : 'Items Subtotal:'}
                    </Text>
                    <Text style={[styles.subtotalVal, { color: colors.text }]}>
                      {formatRupiah(itemsSubtotal)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleUseItemsSubtotal}
                    style={[styles.syncTotalBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="refresh-outline" size={12} color="#FFFFFF" />
                    <Text style={styles.syncTotalBtnText}>
                      {isIndonesian ? 'Samakan Total' : 'Use Sum'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={[styles.emptyItemsBox, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
                <Text style={[styles.emptyItemsText, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'Belum ada rincian item' : 'No items listed'}
                </Text>
              </View>
            )}
          </View>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <NeoInput
              label={t('receipt.notesLabel') || 'Catatan / Keterangan'}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('receipt.notesPlaceholder') || 'cth: Pembelian pakaian'}
              leftIconName="document-text-outline"
            />
          </View>
        </View>
      </NeoModal>

      {/* Edit / Add Item Sub-Modal */}
      <Modal
        visible={itemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.itemModalBackdrop}>
          <View style={[styles.itemModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.itemModalHeader}>
              <Text style={[styles.itemModalTitle, { color: colors.text }]}>
                {itemEditIndex !== null
                  ? (isIndonesian ? 'Edit Item Belanja' : 'Edit Item')
                  : (isIndonesian ? 'Tambah Item Belanja' : 'Add New Item')}
              </Text>
              <Pressable onPress={() => setItemModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.itemModalBody}>
              <View style={styles.inputField}>
                <Text style={[styles.inputFieldLabel, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'Nama Produk / Barang' : 'Product / Item Name'}
                </Text>
                <TextInput
                  value={formItemName}
                  onChangeText={setFormItemName}
                  placeholder="cth: KAOS POLO"
                  placeholderTextColor={colors.textSecondary + '80'}
                  style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
                />
              </View>

              <View style={styles.itemModalRow}>
                <View style={[styles.inputField, { flex: 1 }]}>
                  <Text style={[styles.inputFieldLabel, { color: colors.textSecondary }]}>
                    {isIndonesian ? 'Jumlah (Qty)' : 'Quantity'}
                  </Text>
                  <TextInput
                    value={formItemQty}
                    onChangeText={setFormItemQty}
                    placeholder="1"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary + '80'}
                    style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
                  />
                </View>

                <View style={[styles.inputField, { flex: 2 }]}>
                  <Text style={[styles.inputFieldLabel, { color: colors.textSecondary }]}>
                    {isIndonesian ? 'Harga Satuan (Rp)' : 'Unit Price (Rp)'}
                  </Text>
                  <TextInput
                    value={formItemPrice}
                    onChangeText={setFormItemPrice}
                    placeholder="100000"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary + '80'}
                    style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.itemModalFooter}>
              <View style={{ flex: 1 }}>
                <NeoButton
                  title={isIndonesian ? 'Batal' : 'Cancel'}
                  variant="outline"
                  size="sm"
                  onPress={() => setItemModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <NeoButton
                  title={isIndonesian ? 'Simpan Item' : 'Save Item'}
                  variant="primary"
                  size="sm"
                  iconName="checkmark"
                  onPress={handleSaveItemForm}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Alert modal */}
      {alertConfig && (
        <ConfirmModal
          insideModal={true}
          visible={Boolean(alertConfig)}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type || 'info'}
          confirmText="OK"
          showCancel={false}
          onConfirm={() => setAlertConfig(null)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 20,
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
  inputGroup: {
    marginBottom: 0,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  catBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  catBtnTextCol: {
    flex: 1,
    gap: 2,
  },
  catBtnName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  catBtnSub: {
    fontSize: 10.5,
  },
  catChevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  walletGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletItem2Col: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 2,
  },
  walletItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  walletItemName: {
    fontSize: 12,
    fontWeight: '800',
  },
  walletItemBalance: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  addItemBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemsContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  itemNameCol: {
    flex: 1,
    paddingRight: 8,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemQtyText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  itemRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  itemActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  subtotalTextCol: {
    gap: 1,
  },
  subtotalLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  subtotalVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  syncTotalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  syncTotalBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyItemsBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingBottom: 16,
  },
  actionCol: {
    width: 90,
  },
  actionColFlex: {
    flex: 1,
  },
  itemModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  itemModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  itemModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemModalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  itemModalBody: {
    gap: 10,
  },
  itemModalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputField: {
    gap: 4,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalTextInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  itemModalFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
