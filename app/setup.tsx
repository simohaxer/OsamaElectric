import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function SetupScreen() {
  const router = useRouter();
  const { createUserAndDepartment } = useApp();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setError('');
    
    if (!username.trim() || !password.trim() || !departmentName.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    try {
      setLoading(true);
      await createUserAndDepartment(username, password, departmentName);
      router.replace('/(tabs)');
    } catch (err) {
      setError('حدث خطأ أثناء الإعداد');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/RrzSWhMnrMVJhvyhTyU6QQ/1718738052174.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>مرحباً بك</Text>
          <Text style={styles.subtitle}>إعداد نظام جرد الأصول</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>بيانات المستخدم</Text>
          
          <Input
            label="اسم المستخدم"
            value={username}
            onChangeText={setUsername}
            placeholder="أدخل اسم المستخدم"
            autoCapitalize="none"
            icon={<MaterialIcons name="person" size={20} color={colors.text.secondary} />}
          />
          
          <Input
            label="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            placeholder="أدخل كلمة المرور"
            secureTextEntry
            icon={<MaterialIcons name="lock" size={20} color={colors.text.secondary} />}
          />
          
          <Input
            label="تأكيد كلمة المرور"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="أعد إدخال كلمة المرور"
            secureTextEntry
            icon={<MaterialIcons name="lock-outline" size={20} color={colors.text.secondary} />}
          />
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>بيانات القسم</Text>
          
          <Input
            label="اسم القسم"
            value={departmentName}
            onChangeText={setDepartmentName}
            placeholder="مثال: المخازن - قطع الغيار - الإنتاج"
            icon={<MaterialIcons name="business" size={20} color={colors.text.secondary} />}
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Button
            title="إنشاء الحساب والبدء"
            onPress={handleSetup}
            loading={loading}
            style={styles.button}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.white,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.primary.navy,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary.navy,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
