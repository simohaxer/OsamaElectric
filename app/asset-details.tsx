import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Asset } from '@/services/database';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

export default function AssetDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { assets, updateAsset, deleteAsset } = useApp();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [rfidCode, setRfidCode] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const assetId = parseInt(id as string);
    const foundAsset = assets.find(a => a.id === assetId);
    
    if (foundAsset) {
      setAsset(foundAsset);
      setName(foundAsset.name);
      setSerialNumber(foundAsset.serial_number);
      setQuantity(foundAsset.quantity.toString());
      setLocation(foundAsset.location);
      setRfidCode(foundAsset.rfid_code);
      setPhotoUri(foundAsset.photo_uri || '');
    }
  }, [id, assets]);

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

  const handleSave = async () => {
    if (!asset) return;

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
      
      await updateAsset(asset.id, {
        name,
        serial_number: serialNumber,
        quantity: quantityNum,
        location,
        rfid_code: rfidCode,
        photo_uri: photoUri || undefined,
      });

      Alert.alert('نجح', 'تم تحديث الأصل بنجاح');
      setEditing(false);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء التحديث');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!asset) return;

    Alert.alert('حذف الأصل', 'هل أنت متأكد من حذف هذا الأصل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsset(asset.id);
            Alert.alert('نجح', 'تم حذف الأصل', [
              { text: 'موافق', onPress: () => router.back() },
            ]);
          } catch (error) {
            Alert.alert('خطأ', 'حدث خطأ أثناء الحذف');
            console.error(error);
          }
        },
      },
    ]);
  };

  if (!asset) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>الأصل غير موجود</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Card>
          {editing ? (
            <>
              <View style={styles.photoSection}>
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

              <Input
                label="اسم الأصل *"
                value={name}
                onChangeText={setName}
                placeholder="أدخل اسم الأصل"
              />

              <Input
                label="الرقم التسلسلي *"
                value={serialNumber}
                onChangeText={setSerialNumber}
                placeholder="أدخل الرقم التسلسلي"
              />

              <Input
                label="الكمية *"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                keyboardType="number-pad"
              />

              <Input
                label="الموقع *"
                value={location}
                onChangeText={setLocation}
                placeholder="أدخل موقع الأصل"
              />

              <Input
                label="كود RFID *"
                value={rfidCode}
                onChangeText={setRfidCode}
                placeholder="امسح أو أدخل كود RFID"
              />

              <View style={styles.editButtons}>
                <Button
                  title="حفظ التعديلات"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.saveButton}
                />
                <Button
                  title="إلغاء"
                  onPress={() => {
                    setEditing(false);
                    setName(asset.name);
                    setSerialNumber(asset.serial_number);
                    setQuantity(asset.quantity.toString());
                    setLocation(asset.location);
                    setRfidCode(asset.rfid_code);
                    setPhotoUri(asset.photo_uri || '');
                  }}
                  variant="outline"
                />
              </View>
            </>
          ) : (
            <>
              {asset.photo_uri && (
                <Image
                  source={{ uri: asset.photo_uri }}
                  style={styles.detailPhoto}
                  contentFit="cover"
                />
              )}

              <Text style={styles.assetName}>{asset.name}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailValue}>{asset.serial_number}</Text>
                <Text style={styles.detailLabel}>الرقم التسلسلي</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailValue}>{asset.quantity}</Text>
                <Text style={styles.detailLabel}>الكمية</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailValue}>{asset.location}</Text>
                <Text style={styles.detailLabel}>الموقع</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.rfidValue}>
                  <MaterialIcons name="qr-code" size={20} color={colors.primary.gold} />
                  <Text style={styles.detailValue}>{asset.rfid_code}</Text>
                </View>
                <Text style={styles.detailLabel}>كود RFID</Text>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  title="تعديل"
                  onPress={() => setEditing(true)}
                  variant="secondary"
                  style={styles.editButton}
                />
                <Button
                  title="حذف"
                  onPress={handleDelete}
                  variant="danger"
                  style={styles.deleteButton}
                />
              </View>
            </>
          )}
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
  scrollContent: {
    padding: spacing.md,
  },
  assetName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary.navy,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.light,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  detailValue: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  rfidValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
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
  editButtons: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  saveButton: {
    marginBottom: 0,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
