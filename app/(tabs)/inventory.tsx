import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { databaseService, InventoryResult } from '@/services/database';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { currentSession, createInventorySession, addScan, endInventorySession, department } = useApp();
  
  const [sessionName, setSessionName] = useState('');
  const [rfidInput, setRfidInput] = useState('');
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [result, setResult] = useState<InventoryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentSession) {
      setScannedCodes([]);
      setResult(null);
    }
  }, [currentSession]);

  const handleStartSession = async () => {
    if (!sessionName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الجرد');
      return;
    }

    try {
      setLoading(true);
      await createInventorySession(sessionName);
      setSessionName('');
      Alert.alert('نجح', 'تم بدء جلسة الجرد');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء بدء الجرد');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!rfidInput.trim() || !currentSession) return;

    try {
      await addScan(rfidInput);
      setScannedCodes([rfidInput, ...scannedCodes]);
      setRfidInput('');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء المسح');
      console.error(error);
    }
  };

  const handleEndSession = async () => {
    if (!currentSession || !department) return;

    try {
      setLoading(true);
      const inventoryResult = await databaseService.getInventoryResult(currentSession.id, department.id);
      setResult(inventoryResult);
      endInventorySession();
      
      Alert.alert(
        'اكتمل الجرد',
        `الأصول الموجودة: ${inventoryResult.found.length}\nالأصول المفقودة: ${inventoryResult.missing.length}`
      );
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنهاء الجرد');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentSession) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>جرد الأصول</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card>
            <View style={styles.startSection}>
              <MaterialIcons name="qr-code-scanner" size={80} color={colors.primary.navy} />
              <Text style={styles.startTitle}>بدء جرد جديد</Text>
              <Text style={styles.startSubtitle}>
                قم بمسح تاجات RFID للأصول لإجراء الجرد
              </Text>

              <TextInput
                style={styles.sessionInput}
                placeholder="اسم الجرد (مثال: جرد شهر نوفمبر)"
                value={sessionName}
                onChangeText={setSessionName}
                placeholderTextColor={colors.text.secondary}
                textAlign="right"
              />

              <Button
                title="بدء الجرد"
                onPress={handleStartSession}
                loading={loading}
                style={styles.startButton}
              />
            </View>
          </Card>

          {result && (
            <>
              <Card style={styles.resultCard}>
                <Text style={styles.resultTitle}>نتيجة آخر جرد</Text>
                
                <View style={styles.resultStats}>
                  <View style={[styles.statBox, { backgroundColor: colors.status.success + '20' }]}>
                    <MaterialIcons name="check-circle" size={32} color={colors.status.success} />
                    <Text style={styles.statNumber}>{result.found.length}</Text>
                    <Text style={styles.statLabel}>موجود</Text>
                  </View>
                  
                  <View style={[styles.statBox, { backgroundColor: colors.status.error + '20' }]}>
                    <MaterialIcons name="error" size={32} color={colors.status.error} />
                    <Text style={styles.statNumber}>{result.missing.length}</Text>
                    <Text style={styles.statLabel}>مفقود</Text>
                  </View>
                </View>
              </Card>

              {result.missing.length > 0 && (
                <Card style={styles.missingCard}>
                  <Text style={styles.missingTitle}>الأصول المفقودة</Text>
                  {result.missing.map((asset) => (
                    <View key={asset.id} style={styles.missingItem}>
                      <Text style={styles.missingItemName}>{asset.name}</Text>
                      <Text style={styles.missingItemDetail}>
                        {asset.serial_number} - {asset.location}
                      </Text>
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>جاري الجرد...</Text>
        <Text style={styles.subtitle}>تم مسح: {scannedCodes.length} عنصر</Text>
      </View>

      <View style={styles.scanSection}>
        <Card>
          <View style={styles.scanInput}>
            <TextInput
              style={styles.rfidInput}
              placeholder="امسح أو أدخل كود RFID"
              value={rfidInput}
              onChangeText={setRfidInput}
              onSubmitEditing={handleScan}
              autoFocus
              placeholderTextColor={colors.text.secondary}
              textAlign="right"
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScan}
              disabled={!rfidInput.trim()}
            >
              <MaterialIcons name="add" size={24} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </Card>

        <Button
          title="إنهاء الجرد"
          onPress={handleEndSession}
          variant="secondary"
          loading={loading}
        />
      </View>

      <View style={styles.scannedSection}>
        <Text style={styles.scannedTitle}>الأكواد الممسوحة</Text>
        <FlatList
          data={scannedCodes}
          renderItem={({ item, index }) => (
            <View style={styles.scannedItem}>
              <Text style={styles.scannedCode}>{item}</Text>
              <Text style={styles.scannedIndex}>#{index + 1}</Text>
            </View>
          )}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.scannedList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>لم يتم مسح أي عناصر بعد</Text>
          }
        />
      </View>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.primary.goldLight,
    textAlign: 'right',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  startSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  startTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary.navy,
    textAlign: 'center',
  },
  startSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sessionInput: {
    width: '100%',
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.input.border,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    textAlign: 'right',
  },
  startButton: {
    width: '100%',
  },
  resultCard: {
    marginTop: spacing.md,
  },
  resultTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary.navy,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  resultStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statNumber: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  missingCard: {
    marginTop: spacing.md,
  },
  missingTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.status.error,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  missingItem: {
    padding: spacing.md,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  missingItemName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  missingItemDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  scanSection: {
    padding: spacing.md,
    gap: spacing.md,
  },
  scanInput: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rfidInput: {
    flex: 1,
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.input.border,
    padding: spacing.md,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    textAlign: 'right',
  },
  scanButton: {
    backgroundColor: colors.primary.navy,
    borderRadius: borderRadius.md,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedSection: {
    flex: 1,
    padding: spacing.md,
  },
  scannedTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  scannedList: {
    gap: spacing.sm,
  },
  scannedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  scannedCode: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  scannedIndex: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
