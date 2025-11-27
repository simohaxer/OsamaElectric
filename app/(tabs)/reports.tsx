import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { assets, department } = useApp();
  const [loading, setLoading] = useState(false);

  const generateCSV = (): string => {
    const headers = ['الاسم', 'الرقم التسلسلي', 'الكمية', 'الموقع', 'كود RFID'];
    const rows = assets.map(asset => [
      asset.name,
      asset.serial_number,
      asset.quantity.toString(),
      asset.location,
      asset.rfid_code,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return '\uFEFF' + csvContent;
  };

  const handleExportCSV = async () => {
    if (assets.length === 0) {
      Alert.alert('تنبيه', 'لا توجد أصول لتصديرها');
      return;
    }

    try {
      setLoading(true);
      const csvContent = generateCSV();
      const fileName = `assets_${department?.name}_${new Date().getTime()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'تصدير الأصول',
        });
      }

      Alert.alert('نجح', 'تم تصدير التقرير بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء التصدير');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuantity = () => {
    return assets.reduce((sum, asset) => sum + asset.quantity, 0);
  };

  const getLocationStats = () => {
    const locationMap = new Map<string, number>();
    assets.forEach(asset => {
      const current = locationMap.get(asset.location) || 0;
      locationMap.set(asset.location, current + 1);
    });
    return Array.from(locationMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>التقارير والإحصائيات</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.sectionTitle}>ملخص الأصول</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="inventory-2" size={32} color={colors.primary.navy} />
              <Text style={styles.statValue}>{assets.length}</Text>
              <Text style={styles.statLabel}>إجمالي الأصول</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="format-list-numbered" size={32} color={colors.primary.gold} />
              <Text style={styles.statValue}>{getTotalQuantity()}</Text>
              <Text style={styles.statLabel}>إجمالي الكمية</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>أكثر المواقع</Text>
          
          {getLocationStats().map(([location, count], index) => (
            <View key={location} style={styles.locationItem}>
              <Text style={styles.locationRank}>#{index + 1}</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location}</Text>
                <View style={styles.locationBar}>
                  <View
                    style={[
                      styles.locationBarFill,
                      { width: `${(count / assets.length) * 100}%` }
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.locationCount}>{count}</Text>
            </View>
          ))}

          {getLocationStats().length === 0 && (
            <Text style={styles.emptyText}>لا توجد بيانات متاحة</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>تصدير التقارير</Text>
          
          <View style={styles.exportButtons}>
            <Button
              title="تصدير Excel (CSV)"
              onPress={handleExportCSV}
              loading={loading}
              icon={<MaterialIcons name="table-chart" size={20} color={colors.text.inverse} />}
            />
            
            <Text style={styles.exportNote}>
              ملاحظة: ملفات CSV يمكن فتحها في Microsoft Excel أو Google Sheets
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={24} color={colors.status.info} />
            <Text style={styles.infoText}>
              يتم تصدير جميع بيانات الأصول بما في ذلك الاسم والرقم التسلسلي والكمية والموقع وكود RFID
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary.navy,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
    textAlign: 'right',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary.navy,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  locationRank: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary.gold,
    width: 32,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  locationBar: {
    height: 8,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  locationBarFill: {
    height: '100%',
    backgroundColor: colors.primary.navy,
  },
  locationCount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    minWidth: 32,
    textAlign: 'left',
  },
  exportButtons: {
    gap: spacing.md,
  },
  exportNote: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.status.info + '15',
    borderRadius: borderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlign: 'right',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
