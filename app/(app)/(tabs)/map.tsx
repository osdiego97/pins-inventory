import { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePins } from '../../../hooks/usePins';
import { useTags } from '../../../hooks/useTags';
import { FilterState, Pin } from '../../../lib/types';
import FilterBottomSheet from '../../../components/pins/FilterBottomSheet';

const EMPTY_FILTERS: FilterState = { l1: [], l2: [], country: null, city: null, year: null };

const INITIAL_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

function applyFilters(pins: Pin[], filters: FilterState): Pin[] {
  const { l1, l2, country, city, year } = filters;
  let result = pins;

  const selectedTags = [...l1, ...l2];
  if (selectedTags.length > 0) {
    result = result.filter((p) => (p.tags ?? []).some((t) => selectedTags.includes(t.name)));
  }
  if (country) result = result.filter((p) => p.country === country);
  if (city) result = result.filter((p) => p.city === city);
  if (year) result = result.filter((p) => p.acquired_year === year);

  return result;
}

export default function MapScreen() {
  const { pins, loading, refetch } = usePins();
  const { tagGroups } = useTags();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  useFocusEffect(useCallback(() => { refetch(); }, []));

  const geocodedPins = useMemo(
    () => pins.filter((p) => p.latitude != null && p.longitude != null),
    [pins]
  );

  const filteredPins = useMemo(
    () => applyFilters(geocodedPins, filters),
    [geocodedPins, filters]
  );

  const activeFilterCount = [
    filters.l1.length > 0,
    filters.l2.length > 0,
    filters.country,
    filters.city,
    filters.year,
  ].filter(Boolean).length;

  const isFiltering = activeFilterCount > 0;

  function handleFiltersChange(next: FilterState) {
    setFilters(next);
    if (mapRef.current) {
      const coords = applyFilters(geocodedPins, next).map((p) => ({
        latitude: p.latitude!,
        longitude: p.longitude!,
      }));
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
          animated: true,
        });
      }
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <ClusteredMapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={INITIAL_REGION}
        mapType="standard"
        userInterfaceStyle="dark"
        clusterColor="#e8c97e"
        clusterTextColor="#0f0f0f"
        clusterFontFamily="System"
      >
        {filteredPins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude!, longitude: pin.longitude! }}
            image={require('../../../assets/map-marker.png')}
            tracksViewChanges={false}
          >
            <Callout onPress={() => router.push(`/(app)/pin/${pin.id}` as any)}>
              <View style={{ width: 200, padding: 4 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '600', color: '#0f0f0f' }}
                  numberOfLines={1}
                >
                  {pin.description}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text style={{ fontSize: 11, color: '#606060' }}>
                    #{pin.collection_number} · {pin.city}, {pin.country}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={11}
                    color="#606060"
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </ClusteredMapView>

      {/* Header overlay */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 12 }}
      >
        <View className="bg-surface-elevated rounded-xl px-3 py-2">
          {!loading && (
            <Text className="text-text-primary text-sm font-semibold">
              {isFiltering
                ? `${filteredPins.length} de ${geocodedPins.length} pins`
                : `${geocodedPins.length} pins`}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setFilterSheetVisible(true)}
          className={`flex-row items-center px-3 py-2 rounded-xl gap-1.5 ${
            activeFilterCount > 0 ? 'bg-accent' : 'bg-surface-elevated'
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

      {/* Empty state overlay */}
      {!loading && geocodedPins.length === 0 && (
        <View className="absolute inset-0 items-center justify-center px-8 pointer-events-none">
          <View className="bg-surface-elevated rounded-2xl px-6 py-5 items-center">
            <Ionicons name="earth-outline" size={32} color="#606060" />
            <Text className="text-text-secondary text-sm text-center mt-3">
              Ningún pin tiene ubicación todavía.{'\n'}Edita un pin para añadir su posición en el mapa.
            </Text>
          </View>
        </View>
      )}

      {!loading && geocodedPins.length > 0 && filteredPins.length === 0 && (
        <View className="absolute inset-0 items-center justify-center px-8 pointer-events-none">
          <View className="bg-surface-elevated rounded-2xl px-6 py-5 items-center">
            <Text className="text-text-secondary text-sm text-center">
              No hay pins con ubicación para estos filtros.
            </Text>
          </View>
        </View>
      )}

      {/* Filter sheet */}
      <FilterBottomSheet
        visible={filterSheetVisible}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClose={() => setFilterSheetVisible(false)}
        pins={pins}
        tagGroups={tagGroups}
        search=""
      />
    </View>
  );
}
