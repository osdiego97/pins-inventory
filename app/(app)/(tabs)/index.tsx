import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../lib/utils';
import { usePins } from '../../../hooks/usePins';
import { usePinDelete } from '../../../hooks/usePinDelete';
import { useTags } from '../../../hooks/useTags';
import { useUserSettingsContext } from '../../../contexts/UserSettingsContext';
import { useThemeColors } from '../../../contexts/ThemeContext';
import { FilterState } from '../../../lib/types';
import PinCard from '../../../components/pins/PinCard';
import FilterBottomSheet from '../../../components/pins/FilterBottomSheet';

const EMPTY_FILTERS: FilterState = { l1: [], l2: [], country: null, city: null, year: null, material: [], color: [] };

export default function CollectionScreen() {
  const { pins, loading, error, refetch } = usePins();
  const { confirmDelete } = usePinDelete(refetch);
  const { tagGroups, standaloneTags, refetch: refetchTags } = useTags();
  const { settings } = useUserSettingsContext();
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [showFilterHint, setShowFilterHint] = useState(false);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchTags();
    }, [])
  );

  const { l1, l2, country, city, year, material, color } = filters;

  const filtered = useMemo(() => {
    let result = pins;

    if (search.trim()) {
      const q = normalize(search);
      result = result.filter(
        (p) =>
          normalize(p.description).includes(q) ||
          (p.country && normalize(p.country).includes(q)) ||
          (p.city && normalize(p.city).includes(q)) ||
          (p.region && normalize(p.region).includes(q)) ||
          (p.tags ?? []).some((t) => normalize(t.name).includes(q)) ||
          (p.collection_number !== null && String(p.collection_number).includes(q)) ||
          (p.material && normalize(p.material).includes(q)) ||
          (p.color ?? []).some((c) => normalize(c).includes(q))
      );
    }

    const selectedTags = [...l1, ...l2];
    if (selectedTags.length > 0) {
      result = result.filter((p) => (p.tags ?? []).some((t) => selectedTags.includes(t.name)));
    }
    if (country) result = result.filter((p) => p.country === country);
    if (city) result = result.filter((p) => p.city === city);
    if (year) result = result.filter((p) => p.acquired_year === year);
    if (material.length > 0) result = result.filter((p) => p.material && material.includes(p.material));
    if (color.length > 0) result = result.filter((p) => (p.color ?? []).some((c) => color.includes(c)));

    return result;
  }, [pins, search, l1, l2, country, city, year, material, color]);

  const activeFilterCount = [l1.length > 0, l2.length > 0, country, city, year, material.length > 0, color.length > 0].filter(Boolean).length;

  const isFiltering = search.trim().length > 0 || activeFilterCount > 0;

  const handlePress = useCallback((id: string) => router.push(`/(app)/pin/${id}` as any), []);
  const handleEdit = useCallback((id: string) => router.push(`/(app)/pin/edit/${id}` as any), []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof filtered)[0] }) => (
      <PinCard
        pin={item}
        onPress={handlePress}
        onEdit={handleEdit}
        onDelete={confirmDelete}
      />
    ),
    [handlePress, handleEdit, confirmDelete]
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Padded content area */}
      <View className="flex-1" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-text-primary text-2xl font-bold" numberOfLines={1}>
            {settings?.collection_name ?? 'Mi Colección'}
          </Text>
          {!loading && (
            <Text className="text-text-muted text-sm mt-0.5">
              {isFiltering ? `${filtered.length} de ${pins.length} elementos` : `${pins.length} elementos`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/settings' as any)}
          className="mt-1"
        >
          <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Search bar + Filter button */}
      <View className="mx-4 mb-3 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-surface-card rounded-xl px-3">
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            className="flex-1 ml-2 py-3 text-text-primary text-sm"
            placeholder="Descripción, país, material, #42..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            if (pins.length === 0) {
              setShowFilterHint(true);
              setTimeout(() => setShowFilterHint(false), 2500);
            } else {
              setFilterSheetVisible(true);
            }
          }}
          className={`flex-row items-center px-3 py-3 rounded-xl gap-1.5 ${
            activeFilterCount > 0 ? 'bg-accent' : 'bg-surface-card'
          }`}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? colors.surface : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <Text className="text-surface text-xs font-bold">{activeFilterCount}</Text>
          )}
        </TouchableOpacity>
      </View>
      {showFilterHint && (
        <Text className="text-text-muted text-xs mx-4 mb-2">
          Añade elementos a tu colección para poder filtrar.
        </Text>
      )}

      {/* Content */}
      {loading && pins.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-center">{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-center">
            {isFiltering
              ? 'No hay elementos que coincidan con los filtros activos.'
              : 'Aún no tienes elementos. ¡Añade el primero!'}
          </Text>
        </View>
      ) : (
        <FlatList
data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 80,
          }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={15}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        className="absolute right-4 bg-accent rounded-full w-14 h-14 items-center justify-center"
        style={{ bottom: insets.bottom + 24 }}
        onPress={() => router.push('/(app)/pin/new' as any)}
      >
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>
      </View>{/* end padded content */}

      {/* Filter overlay — outside padded view so it covers the full screen */}
      <FilterBottomSheet
        visible={filterSheetVisible}
        filters={filters}
        onFiltersChange={setFilters}
        standaloneTags={standaloneTags}
        onClose={() => setFilterSheetVisible(false)}
        pins={pins}
        tagGroups={tagGroups}
        search={search}
      />
    </View>
  );
}
