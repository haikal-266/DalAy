import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoSegmented } from '../neo/NeoSegmented';
import { CategoryIcon } from '../common/CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useFinance } from '../../stores/financeStore';
import { formatRupiah, formatCompact } from '../../utils/formatters';

export const PieChartSection = ({
  categoryStats = { type: 'expense', totalNominal: 0, categories: [] },
  periodFilter = 'all',
  onSelectPeriod = () => {},
  typeFilter = 'expense',
  onSelectType = () => {},
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { getCategoryStats } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chartType, setChartType] = useState(typeFilter === 'income' ? 'income' : 'expense');

  const isIncome = chartType === 'income';

  // Compute category statistics strictly for the active chart type (excludes transfers and adjustments)
  const currentStats = typeof getCategoryStats === 'function'
    ? getCategoryStats(chartType)
    : categoryStats;

  const categories = currentStats.categories || [];
  const totalNominal = currentStats.totalNominal || 0;

  // Computed helper strings
  const emptyText = isIndonesian
    ? `Belum ada catatan ${isIncome ? 'pemasukan' : 'pengeluaran'} pada periode ini.`
    : `No ${isIncome ? 'income' : 'expense'} records found in this period.`;

  const typeLabel = isIncome
    ? (isIndonesian ? 'Pemasukan' : 'Income')
    : (isIndonesian ? 'Pengeluaran' : 'Expense');

  // Responsive Donut chart parameters
  const size = 220;
  const strokeWidth = 38;
  const radius = 95;
  const innerRadius = radius - strokeWidth;
  const cx = size / 2;
  const cy = size / 2;

  // Helper to convert polar coordinates to Cartesian
  const polarToCartesian = (centerX, centerY, rad, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  };

  // Generate SVG Path for a donut slice
  const createDonutSlice = (startAngle, endAngle, rOuter, rInner) => {
    if (endAngle - startAngle >= 359.9) {
      endAngle = 359.99;
    }

    const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
    const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
    const startInner = polarToCartesian(cx, cy, rInner, endAngle);
    const endInner = polarToCartesian(cx, cy, rInner, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };

  // Calculate slices
  let cumulativeAngle = 0;
  const isSingleCategory =
    categories.length === 1 ||
    (categories.length > 0 && categories[0].percentage >= 99.9);

  const slices = categories.map((cat) => {
    const sliceAngle = Math.max(0.5, (cat.percentage / 100) * 360);
    const start = cumulativeAngle;
    const end = Math.min(359.99, cumulativeAngle + sliceAngle);
    cumulativeAngle += sliceAngle;

    const isSelected = selectedCategory && selectedCategory.id === cat.id;
    const currentOuterR = isSelected ? radius + 4 : radius;
    const currentInnerR = isSelected ? innerRadius - 2 : innerRadius;

    const pathData = createDonutSlice(start, end, currentOuterR, currentInnerR);

    return {
      ...cat,
      start,
      end,
      pathData,
      isSelected,
    };
  });

  return (
    <NeoCard variant="white" padding={16} style={styles.container}>
      {/* Top Period Selector Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="pie-chart" size={16} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {isIndonesian ? 'STATISTIK & PROPORSI' : 'STATISTICS & BREAKDOWN'}
          </Text>
        </View>
        <NeoSegmented
          options={[
            { label: t('finance.today', 'Hari Ini'), value: 'today' },
            { label: t('finance.thisWeek', 'Minggu Ini'), value: 'week' },
            { label: t('finance.thisMonth', 'Bulan Ini'), value: 'month' },
            { label: isIndonesian ? 'Semua Periode' : t('finance.allPeriods', 'All Periods'), value: 'all' },
          ]}
          selectedValue={periodFilter}
          onSelect={(val) => {
            setSelectedCategory(null);
            onSelectPeriod(val);
          }}
          allowMultiLine={true}
          style={styles.periodSegmented}
        />
      </View>

      {/* Type Toggle (Pengeluaran vs Pemasukan) */}
      <NeoSegmented
        options={[
          {
            label: t('finance.expense', 'Pengeluaran'),
            value: 'expense',
            iconName: 'arrow-up',
            activeColor: colors.expense,
          },
          {
            label: t('finance.income', 'Pemasukan'),
            value: 'income',
            iconName: 'arrow-down',
            activeColor: colors.income,
          },
        ]}
        selectedValue={isIncome ? 'income' : 'expense'}
        onSelect={(val) => {
          setSelectedCategory(null);
          setChartType(val);
          if (typeof onSelectType === 'function') {
            onSelectType(val);
          }
        }}
        style={styles.typeSegmented}
      />

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.surfaceLight },
            ]}
          >
            <Ionicons
              name="pie-chart-outline"
              size={36}
              color={colors.textSubtle}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {isIndonesian ? 'Belum Ada Transaksi' : 'No Transactions Recorded'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {emptyText}
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {/* Donut Chart Visual */}
          <View style={styles.chartWrapper}>
            <Svg width={size} height={size}>
              <G>
                {/* Background Track Circle */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={(radius + innerRadius) / 2}
                  stroke={colors.surfaceLight}
                  strokeWidth={strokeWidth}
                  fill="none"
                />

                {/* Slices */}
                {isSingleCategory && categories.length > 0 ? (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={(radius + innerRadius) / 2}
                    stroke={categories[0].color || colors.primary}
                    strokeWidth={strokeWidth}
                    fill="none"
                    onPress={() => setSelectedCategory(categories[0])}
                  />
                ) : (
                  slices.map((slice) => (
                    <Path
                      key={slice.id}
                      d={slice.pathData}
                      fill={slice.color || colors.primary}
                      stroke={colors.surface}
                      strokeWidth={slice.isSelected ? 3 : 2}
                      onPress={() => setSelectedCategory(slice.isSelected ? null : slice)}
                    />
                  ))
                )}
              </G>
            </Svg>

            {/* Central Donut Text */}
            <Pressable
              style={styles.donutCenter}
              onPress={() => setSelectedCategory(null)}
            >
              {selectedCategory ? (
                <>
                  <Text
                    style={[styles.donutCenterLabel, { color: colors.textSecondary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    {selectedCategory.name}
                  </Text>
                  <Text
                    style={[styles.donutCenterAmount, { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    {formatCompact(selectedCategory.amount)}
                  </Text>
                  <Text
                    style={[styles.donutCenterSub, { color: colors.primary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    {selectedCategory.percentage.toFixed(1)}%
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.donutCenterLabel, { color: colors.textSecondary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    TOTAL
                  </Text>
                  <Text
                    style={[styles.donutCenterAmount, { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    {formatCompact(totalNominal)}
                  </Text>
                  <Text
                    style={[
                      styles.donutCenterSub,
                      {
                        color: isIncome ? colors.incomeDark : colors.expenseDark,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    {typeLabel}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Interactive Legend List */}
          <View style={styles.legendContainer}>
            {categories.slice(0, 8).map((cat) => {
              const isSelected = selectedCategory && selectedCategory.id === cat.id;

              return (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [
                    styles.legendItem,
                    {
                      backgroundColor: isSelected
                        ? colors.primarySurface
                        : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                    pressed && styles.legendItemPressed,
                  ]}
                  onPress={() => {
                    setSelectedCategory(isSelected ? null : cat);
                  }}
                >
                  <View style={styles.legendLeft}>
                    <CategoryIcon
                      iconName={cat.iconName || 'cube'}
                      iconFamily={cat.iconFamily || 'Ionicons'}
                      color={cat.color || colors.primary}
                      bgColor={cat.bgColor || colors.surfaceLight}
                      size={14}
                      containerSize={28}
                      borderRadius={7}
                    />
                    <View style={styles.legendTexts}>
                      <Text
                        style={[
                          styles.legendName,
                          {
                            color: isSelected ? colors.primaryDark : colors.text,
                            fontWeight: isSelected ? '800' : '700',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                      <Text
                        style={[styles.legendAmount, { color: colors.textSecondary }]}
                      >
                        {formatRupiah(cat.amount)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.legendBadge,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.surfaceLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.legendPercent,
                        {
                          color: isSelected
                            ? colors.primaryDark
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {cat.percentage.toFixed(0)}%
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  periodSegmented: {
    marginBottom: 6,
  },
  typeSegmented: {
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  contentRow: {
    alignItems: 'center',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 114,
    height: 114,
    borderRadius: 57,
    paddingHorizontal: 6,
  },
  donutCenterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    maxWidth: '100%',
  },
  donutCenterAmount: {
    fontSize: 14.5,
    fontWeight: '900',
    marginVertical: 1,
    textAlign: 'center',
    maxWidth: '100%',
  },
  donutCenterSub: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '100%',
  },
  legendContainer: {
    width: '100%',
    marginTop: 8,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  legendTexts: {
    flex: 1,
  },
  legendName: {
    fontSize: 12,
  },
  legendAmount: {
    fontSize: 11,
    marginTop: 1,
  },
  legendBadge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  legendPercent: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default PieChartSection;
