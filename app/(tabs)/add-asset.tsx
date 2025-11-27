import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function AddAssetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addAsset } = useApp();
  
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [rfidCode, setRfidCode] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !serialNumber.trim() || !location.trim() || !rfidCode.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      Alert.alert('خطأ', 'يرجى إدخال كمية صحيحة');
      return;
    }

    try {
      setLoading(true);
      
      await addAsset({
        name,
        serial_number: serialNumber,
        quantity: quantityNum,
        location,
        rfid_code: rfidCode,
        photo_uri: photoUri || undefined,
      });

      Alert.alert('نجح', 'تم إضافة الأصل بنجاح', [
        {
          text: 'موافق',
          onPress: () => {
            setName('');
            setSerialNumber('');
            setQuantity('1');
            setLocation('');
            setRfidCode('');
            setPhotoUri('');
            router.push('/(tabs)');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الأصل');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>إضافة أصل جديد</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Input
            label="اسم الأصل *"
            value={name}
            onChangeText={setName}
            placeholder="أدخل اسم الأصل"
            icon={<MaterialIcons name="label" size={20} color={colors.text.secondary} />}
          />

          <Input
            label="الرقم التسلسلي *"
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="أدخل الرقم التسلسلي"
            icon={<MaterialIcons name="tag" size={20} color={colors.text.secondary} />}
          />

          <Input
            label="الكمية *"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            keyboardType="number-pad"
            icon={<MaterialIcons name="format-list-numbered" size={20} color={colors.text.secondary} />}
          />

          <Input
            label="الموقع *"
            value={location}
            onChangeText={setLocation}
            placeholder="أدخل موقع الأصل"
            icon={<MaterialIcons name="location-on" size={20} color={colors.text.secondary} />}
          />

          <Input
            label="كود RFID *"
            value={rfidCode}
            onChangeText={setRfidCode}
            placeholder="امسح أو أدخل كود RFID"
            icon={<MaterialIcons name="qr-code" size={20} color={colors.primary.gold} />}
          />

          <View style={styles.photoSection}>
            <Text style={styles.label}>صورة الأصل (اختياري)</Text>
            
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoImage} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoUri('')}
                >
                  <MaterialIcons name="close" size={20} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <MaterialIcons name="add-a-photo" size={40} color={colors.primary.navy} />
                <Text style={styles.photoButtonText}>اختر صورة</Text>
              </TouchableOpacity>
            )}
          </View>

          <Button
            title="حفظ الأصل"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
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
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  photoSection: {
    marginBottom: spacing.md,
  },
  photoButton: {
    backgroundColor: colors.background.light,
    borderWidth: 2,
    borderColor: colors.border.medium,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  photoButtonText: {
    fontSize: typography.sizes.base,
    color: colors.primary.navy,
    fontWeight: typography.weights.medium,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background.light,
  },
  removePhotoButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
