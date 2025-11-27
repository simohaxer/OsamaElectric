import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { Card } from '@/components/ui/Card';
import { Asset } from '@/services/database';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export default function AssetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { assets, loadAssets, searchAssets, department } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(assets);
  const [sortBy, setSortBy] = useState<'name' | 'location'>('name');

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    setFilteredAssets(assets);
  }, [assets]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, assets]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const sorted = [...assets].sort((a, b) => 
        sortBy === 'name' 
          ? a.name.localeCompare(b.name, 'ar')
          : a.location.localeCompare(b.location, 'ar')
      );
      setFilteredAssets(sorted);
    } else {
      const results = await searchAssets(searchQuery);
      const sorted = [...results].sort((a, b) => 
        sortBy === 'name' 
          ? a.name.localeCompare(b.name, 'ar')
          : a.location.localeCompare(b.location, 'ar')
      );
      setFilteredAssets(sorted);
    }
  };

  const handleSort = () => {
    const newSortBy = sortBy === 'name' ? 'location' : 'name';
    setSortBy(newSortBy);
    
    const sorted = [...filteredAssets].sort((a, b) => 
      newSortBy === 'name' 
        ? a.name.localeCompare(b.name, 'ar')
        : a.location.localeCompare(b.location, 'ar')
    );
    setFilteredAssets(sorted);
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/asset-details', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <Card style={styles.assetCard}>
        <View style={styles.assetContent}>
          {item.photo_uri && (
            <Image
              source={{ uri: item.photo_uri }}
              style={styles.assetImage}
              contentFit="cover"
            />
          )}
          
          <View style={styles.assetInfo}>
            <Text style={styles.assetName}>{item.name}</Text>
            
            <View style={styles.assetDetail}>
              <Text style={styles.assetDetailText}>الرقم التسلسلي: {item.serial_number}</Text>
            </View>
            
            <View style={styles.assetDetail}>
              <MaterialIcons name="location-on" size={16} color={colors.text.secondary} />
              <Text style={styles.assetDetailText}>{item.location}</Text>
            </View>
            
            <View style={styles.assetDetail}>
              <MaterialIcons name="qr-code" size={16} color={colors.primary.gold} />
              <Text style={styles.assetDetailText}>{item.rfid_code}</Text>
            </View>
            
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>الكمية: {item.quantity}</Text>
            </View>
          </View>
          
          <MaterialIcons name="chevron-left" size={24} color={colors.text.secondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>أصول {department?.name}</Text>
        <Text style={styles.subtitle}>إجمالي الأصول: {assets.length}</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث بالاسم أو الرقم التسلسلي أو RFID"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.secondary}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity style={styles.sortButton} onPress={handleSort}>
          <MaterialIcons name="sort" size={20} color={colors.primary.navy} />
          <Text style={styles.sortButtonText}>
            {sortBy === 'name' ? 'الاسم' : 'الموقع'}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredAssets.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="inventory-2" size={80} color={colors.border.medium} />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد أصول بعد'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptyStateSubtext}>
              اضغط على "إضافة أصل" لبدء إضافة الأصول
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredAssets}
          renderItem={renderAssetItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchSection: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    paddingVertical: spacing.md,
    textAlign: 'right',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  sortButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.primary.navy,
    fontWeight: typography.weights.medium,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  assetCard: {
    padding: spacing.md,
  },
  assetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assetImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.light,
  },
  assetInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  assetName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'right',
  },
  assetDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  assetDetailText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  quantityBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  quantityText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
