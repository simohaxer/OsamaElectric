import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, department, logout } = useApp();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>الإعدادات</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={48} color={colors.primary.gold} />
            </View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.department}>{department?.name}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>معلومات التطبيق</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>1.0.0</Text>
            <Text style={styles.infoLabel}>الإصدار</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>SQLite</Text>
            <Text style={styles.infoLabel}>قاعدة البيانات</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>محلي (بدون إنترنت)</Text>
            <Text style={styles.infoLabel}>وضع التشغيل</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>الدعم</Text>
          
          <View style={styles.supportBox}>
            <MaterialIcons name="support-agent" size={32} color={colors.primary.navy} />
            <Text style={styles.supportText}>
              للدعم الفني والمساعدة، يرجى التواصل مع قسم تكنولوجيا المعلومات
            </Text>
          </View>
        </Card>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={24} color={colors.status.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
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
  userSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  username: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  department: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary.navy,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.xs,
  },
  supportBox: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  supportText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlign: 'right',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  logoutText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.status.error,
  },
});
