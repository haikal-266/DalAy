import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoSegmented } from '../neo/NeoSegmented';
import { CategoryIcon } from '../common/CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { formatRupiah, formatCompact } from '../../utils/formatters';

export const PieChartSection = ({
  categoryStats = { type: 'expense', totalNominal: 0, categories: [] },
  periodFilter = 'all',
  onSelectPeriod,
  typeFilter = 'expense',
  onSelectType,
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = categoryStats.categories || [];
  const totalNominal = categoryStats.totalNominal || 0;

  // Responsive larger Donut chart parameters
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
      {/* Top Filter Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="pie-chart" size={16} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            STATISTIK & PROPORSI
          </Text>
        </View>
        <NeoSegmented
          options={[
            { label: 'Hari Ini', value: 'today' },
            { label: 'Minggu', value: 'week' },
            { label: 'Bulan', value: 'month' },
            { label: 'Semua', value: 'all' },
          ]}
          selectedValue={periodFilter}
          onSelect={onSelectPeriod}
          style={styles.periodSegmented}
        />
      </View>

      {/* Type Toggle (Pengeluaran vs Pemasukan) */}
      <NeoSegmented
        options={[
          {
            label: 'Pengeluaran',
            value: 'expense',
            iconName: 'arrow-up',
            activeColor: colors.expense,
          },
          {
            label: 'Pemasukan',
            value: 'income',
            iconName: 'arrow-down',
            activeColor: colors.income,
          },
        ]}
        selectedValue={typeFilter}
        onSelect={onSelectType}
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
            Belum Ada Transaksi
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Belum ada catatan{' '}
            {typeFilter === 'income' ? 'pemasukan' : 'pengeluaran'} pada periode
            ini.
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
                  />
                ) : (
                  slices.map((slice) => (
                    <Path
                      key={slice.id}
                      d={slice.pathData}
                      fill={slice.color || colors.primary}
                      stroke={colors.surface}
                      strokeWidth={2}
                    />
                  ))
                )}
              </G>
            </Svg>

            {/* Central Donut Text */}
            <View style={styles.donutCenter}>
              {selectedCategory ? (
                <>
                  <Text
                    style={[styles.donutCenterLabel, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {selectedCategory.name}
                  </Text>
                  <Text
                    style={[styles.donutCenterAmount, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {formatCompact(selectedCategory.amount)}
                  </Text>
                  <Text
                    style={[styles.donutCenterSub, { color: colors.primary }]}
                  >
                    {selectedCategory.percentage.toFixed(1)}%
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.donutCenterLabel, { color: colors.textSecondary }]}
                  >
                    TOTAL
                  </Text>
                  <Text
                    style={[styles.donutCenterAmount, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {formatCompact(totalNominal)}
                  </Text>
                  <Text
                    style={[
                      styles.donutCenterSub,
                      {
                        color:
                          typeFilter === 'income'
                            ? colors.incomeDark
                            : colors.expenseDark,
                      },
                    ]}
                  >
                    {typeFilter === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Interactive Legend List */}
          <View style={styles.legendContainer}>
            {categories.slice(0, 6).map((cat) => {
              const isSelected = selectedCategory && selectedCategory.id === cat.id;

              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.legendItem,
                    {
                      backgroundColor: isSelected
                        ? colors.primarySurface
                        : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(isSelected ? null : cat);
                  }}
                >
                  <View style={styles.legendLeft}>
                    <CategoryIcon
                      name={cat.iconName || 'cube'}
                      family={cat.iconFamily || 'Ionicons'}
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
    marginBottom: 4,
  },
  typeSegmented: {
    marginBottom: 10,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 3,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  contentRow: {
    alignItems: 'center',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  donutCenter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  donutCenterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  donutCenterAmount: {
    fontSize: 17,
    fontWeight: '900',
    marginVertical: 1,
  },
  donutCenterSub: {
    fontSize: 11,
    fontWeight: '800',
  },
  legendContainer: {
    width: '100%',
    marginTop: 10,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  legendTexts: {
    flex: 1,
  },
  legendName: {
    fontSize: 12,
  },
  legendAmount: {
    fontSize: 10,
    marginTop: 1,
    fontWeight: '500',
  },
  legendBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  legendPercent: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default PieChartSection;
