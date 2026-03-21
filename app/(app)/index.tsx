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
import { usePins } from '../../hooks/usePins';
import { usePinDelete } from '../../hooks/usePinDelete';
import { useTags } from '../../hooks/useTags';
import { FilterState } from '../../lib/types';
import PinCard from '../../components/pins/PinCard';
import FilterBottomSheet from '../../components/pins/FilterBottomSheet';

const EMPTY_FILTERS: FilterState = { l1: null, l2: null, country: null, city: null, year: null };

export default function CollectionScreen() {
  const { pins, loading, error, refetch } = usePins();
  const { confirmDelete } = usePinDelete(refetch);
  const { tagGroups } = useTags();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const { l1, l2, country, city, year } = filters;

  const filtered = useMemo(() => {
    let result = pins;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.description.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q)
      );
    }

    if (l1) result = result.filter((p) => (p.tags ?? []).some((t) => !t.parent_id && t.name === l1));
    if (l2) result = result.filter((p) => (p.tags ?? []).some((t) => t.parent_id && t.name === l2));
    if (country) result = result.filter((p) => p.country === country);
    if (city) result = result.filter((p) => p.city === city);
    if (year) result = result.filter((p) => p.acquired_year === year);

    return result;
  }, [pins, search, l1, l2, country, city, year]);

  const activeFilterCount = [l1, l2, country, city, year].filter(Boolean).length;

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
      <View className="px-4 pt-4 pb-2">
        <Text className="text-text-primary text-2xl font-bold">Mi Colección</Text>
        {!loading && (
          <Text className="text-text-muted text-sm mt-0.5">
            {isFiltering ? `${filtered.length} de ${pins.length} pins` : `${pins.length} pins`}
          </Text>
        )}
      </View>

      {/* Search bar + Filter button */}
      <View className="mx-4 mb-3 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-surface-card rounded-xl px-3">
          <Ionicons name="search" size={16} color="#606060" />
          <TextInput
            className="flex-1 ml-2 py-3 text-text-primary text-sm"
            placeholder="Buscar pins..."
            placeholderTextColor="#606060"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#606060" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setFilterSheetVisible(true)}
          className={`flex-row items-center px-3 py-3 rounded-xl gap-1.5 ${
            activeFilterCount > 0 ? 'bg-accent' : 'bg-surface-card'
          }`}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? '#0f0f0f' : '#909090'}
          />
          {activeFilterCount > 0 && (
            <Text className="text-surface text-xs font-bold">{activeFilterCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#e8c97e" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-center">{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-center">
            {isFiltering
              ? 'No hay pins que coincidan con los filtros activos.'
              : 'Aún no tienes pins. ¡Añade el primero!'}
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
        <Ionicons name="add" size={28} color="#0f0f0f" />
      </TouchableOpacity>
      </View>{/* end padded content */}

      {/* Filter overlay — outside padded view so it covers the full screen */}
      <FilterBottomSheet
        visible={filterSheetVisible}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setFilterSheetVisible(false)}
        pins={pins}
        tagGroups={tagGroups}
        search={search}
      />
    </View>
  );
}
