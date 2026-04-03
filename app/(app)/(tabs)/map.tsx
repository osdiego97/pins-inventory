import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePins } from '../../../hooks/usePins';
import { useTags } from '../../../hooks/useTags';
import { FilterState, Pin } from '../../../lib/types';
import FilterBottomSheet from '../../../components/pins/FilterBottomSheet';
import TagIcon from '../../../components/ui/TagIcon';

const EMPTY_FILTERS: FilterState = { l1: [], l2: [], country: null, city: null, year: null };

const INITIAL_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

const CALLOUT_WIDTH = 220;
const CALLOUT_PADDING_V = 10;
const ROW_H = 37;
const DIVIDER_H = 13;
const MARKER_HEIGHT = 44;
const CALLOUT_GAP = 6;
const MAX_VISIBLE_PINS = 5;
const MAX_LIST_H = MAX_VISIBLE_PINS * ROW_H + (MAX_VISIBLE_PINS - 1) * DIVIDER_H;

interface PinGroup {
  key: string;
  latitude: number;
  longitude: number;
  pins: Pin[];
}

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

function groupByLocation(pins: Pin[]): PinGroup[] {
  const map = new Map<string, PinGroup>();
  pins.forEach((pin) => {
    const key = `${pin.latitude},${pin.longitude}`;
    if (!map.has(key)) {
      map.set(key, { key, latitude: pin.latitude!, longitude: pin.longitude!, pins: [] });
    }
    map.get(key)!.pins.push(pin);
  });
  return Array.from(map.values());
}

function geoToScreen(
  lat: number, lng: number, region: Region, W: number, H: number
): { x: number; y: number } {
  const x = ((lng - region.longitude) / region.longitudeDelta) * W + W / 2;
  const y = ((region.latitude - lat) / region.latitudeDelta) * H + H / 2;
  return { x, y };
}

function calloutPosition(group: PinGroup, region: Region, W: number, H: number) {
  const { x, y } = geoToScreen(group.latitude, group.longitude, region, W, H);
  const calloutH = CALLOUT_PADDING_V * 2 + group.pins.length * ROW_H + (group.pins.length - 1) * DIVIDER_H;
  const left = Math.max(8, Math.min(x - CALLOUT_WIDTH / 2, W - CALLOUT_WIDTH - 8));
  // bottom = distance from container bottom to overlay bottom edge
  // overlay bottom sits MARKER_HEIGHT + GAP above marker tip
  const bottom = H - y + MARKER_HEIGHT + CALLOUT_GAP;
  return { left, bottom, calloutH };
}

const styles = StyleSheet.create({
  calloutBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: CALLOUT_PADDING_V,
    width: CALLOUT_WIDTH,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  clusterContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  clusterWrapper: { position: 'absolute', opacity: 0.5, zIndex: 0 },
  clusterInner: { display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  clusterText: { fontWeight: 'bold' },
});

export default function MapScreen() {
  const { pins, loading, refetch } = usePins();
  const { tagGroups } = useTags();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PinGroup | null>(null);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const superClusterRef = useRef<any>(null);
  const pinGroupsRef = useRef<PinGroup[]>([]);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [markerEpoch, setMarkerEpoch] = useState(0);

  // Refs so onRegionChange never has stale closures
  const mapRegionRef = useRef<Region>(INITIAL_REGION);
  const containerRef = useRef({ width: 0, height: 0 });
  const selectedGroupRef = useRef<PinGroup | null>(null);
  const suppressMapPressRef = useRef(false);

  // Animated values — updated via setValue (no re-renders)
  const animLeft = useRef(new Animated.Value(0)).current;
  const animBottom = useRef(new Animated.Value(0)).current;

  function updateOverlay(group: PinGroup, region: Region) {
    const { width: W, height: H } = containerRef.current;
    if (W === 0) return;
    const { left, bottom } = calloutPosition(group, region, W, H);
    animLeft.setValue(left);
    animBottom.setValue(bottom);
  }

  function selectGroup(group: PinGroup | null) {
    if (group) suppressMapPressRef.current = true;
    selectedGroupRef.current = group;
    setSelectedGroup(group);
    if (group) updateOverlay(group, mapRegionRef.current);
  }

  function handleRegionChange(r: Region) {
    mapRegionRef.current = r;
    const g = selectedGroupRef.current;
    if (g) updateOverlay(g, r);
  }

  function handleRegionChangeComplete(r: Region) {
    mapRegionRef.current = r;
    const g = selectedGroupRef.current;
    if (g) updateOverlay(g, r);
  }

  useFocusEffect(useCallback(() => {
    refetch();
    setTracksViewChanges(true);
    setMarkerEpoch((e) => e + 1);
    const timer = setTimeout(() => setTracksViewChanges(false), 1000);
    return () => { clearTimeout(timer); selectGroup(null); };
  }, []));

  const geocodedPins = useMemo(
    () => pins.filter((p) => p.latitude != null && p.longitude != null),
    [pins]
  );
  const filteredPins = useMemo(() => applyFilters(geocodedPins, filters), [geocodedPins, filters]);
  const pinGroups = useMemo(() => groupByLocation(filteredPins), [filteredPins]);

  pinGroupsRef.current = pinGroups;

  const activeFilterCount = [
    filters.l1.length > 0, filters.l2.length > 0,
    filters.country, filters.city, filters.year,
  ].filter(Boolean).length;

  const isFiltering = activeFilterCount > 0;

  function handleFiltersChange(next: FilterState) {
    setFilters(next);
    selectGroup(null);
    if (mapRef.current) {
      const coords = applyFilters(geocodedPins, next).map((p) => ({
        latitude: p.latitude!, longitude: p.longitude!,
      }));
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
          animated: true,
        });
      }
    }
  }

  function renderCluster(cluster: any) {
    const { id, geometry, onPress, properties } = cluster;
    const { point_count } = properties;
    const [longitude, latitude] = geometry.coordinates;

    let totalPins = point_count;
    try {
      const leaves = superClusterRef.current?.getLeaves(id, Infinity) ?? [];
      if (leaves.length > 0) {
        const sum = leaves.reduce((acc: number, leaf: any) => {
          const group = pinGroupsRef.current[leaf.properties.index];
          return acc + (group?.pins.length ?? 1);
        }, 0);
        if (sum > 0) totalPins = sum;
      }
    } catch (_) {}

    const size = 36;
    const outer = 48;

    return (
      <Marker
        key={`${longitude}_${latitude}`}
        coordinate={{ latitude, longitude }}
        style={{ zIndex: point_count + 1 }}
        onPress={onPress}
        tracksViewChanges={tracksViewChanges}
      >
        <TouchableOpacity
          activeOpacity={0.5}
          style={[styles.clusterContainer, { width: outer, height: outer }]}
        >
          <View style={[styles.clusterWrapper, {
            backgroundColor: '#e8c97e',
            width: outer, height: outer, borderRadius: outer / 2,
          }]} />
          <View style={[styles.clusterInner, {
            backgroundColor: '#e8c97e',
            width: size, height: size, borderRadius: size / 2,
          }]}>
            <Text style={[styles.clusterText, { color: '#0f0f0f', fontSize: 15 }]}>
              {totalPins}
            </Text>
          </View>
        </TouchableOpacity>
      </Marker>
    );
  }

  return (
    <View
      className="flex-1 bg-surface"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        containerRef.current = { width, height };
      }}
    >
      <ClusteredMapView
        ref={mapRef}
        superClusterRef={superClusterRef}
        renderCluster={renderCluster}
        style={{ flex: 1 }}
        initialRegion={INITIAL_REGION}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={() => {
          if (suppressMapPressRef.current) { suppressMapPressRef.current = false; return; }
          if (selectedGroupRef.current) selectGroup(null);
        }}
        mapType="standard"
        userInterfaceStyle="dark"
        clusterColor="#e8c97e"
        clusterTextColor="#0f0f0f"
        clusterFontFamily="System"
      >
        {pinGroups.map((group) => {
          const isMulti = group.pins.length > 1;
          return (
            <Marker
              key={`${group.key}-${markerEpoch}`}
              coordinate={{ latitude: group.latitude, longitude: group.longitude }}
              tracksViewChanges={tracksViewChanges}
              {...(isMulti ? { onPress: () => selectGroup(group) } : {})}
            >
              <View collapsable={false} style={{ width: 40, height: MARKER_HEIGHT }}>
                <Ionicons name="location-sharp" size={40} color="#e8c97e" style={{ zIndex: 0 }} />
                {isMulti && (
                  <View style={{
                    position: 'absolute', top: 0, right: 0, zIndex: 1, elevation: 1,
                    backgroundColor: '#f5f5f5', borderRadius: 8, minWidth: 16, height: 16,
                    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
                    borderWidth: 1, borderColor: '#0f0f0f',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#0f0f0f' }}>
                      {group.pins.length}
                    </Text>
                  </View>
                )}
              </View>
              {!isMulti && (
                <Callout
                  tooltip
                  onPress={() => router.push(`/(app)/pin/${group.pins[0].id}` as any)}
                >
                  <View collapsable={false} style={styles.calloutBox}>
                    {(() => {
                      const pin = group.pins[0];
                      const l1 = (pin.tags ?? []).find((t) => !t.parent_id)?.name;
                      return (
                        <>
                          <View style={{ ...styles.row, gap: 6 }}>
                            {l1 && <TagIcon tagName={l1} size={12} color="#909090" />}
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#f5f5f5', flex: 1 }} numberOfLines={1}>
                              {pin.description}
                            </Text>
                          </View>
                          <View style={{ ...styles.row, marginTop: 4 }}>
                            <Text style={{ fontSize: 11, color: '#909090', flex: 1 }} numberOfLines={1}>
                              #{pin.collection_number} · {pin.city}, {pin.country}
                            </Text>
                            <Ionicons name="chevron-forward" size={11} color="#e8c97e" />
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </Callout>
              )}
            </Marker>
          );
        })}
      </ClusteredMapView>

      {/* Multi-pin overlay — tracks marker via Animated.Value.setValue on region change */}
      {selectedGroup && (
        <Animated.View style={[styles.calloutBox, { position: 'absolute', left: animLeft, bottom: animBottom, elevation: 10, zIndex: 10 }]}>
          <View style={{ ...styles.row, justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: '#606060', fontWeight: '600' }}>
              {selectedGroup.pins.length} pins aquí
            </Text>
            <TouchableOpacity onPress={() => selectGroup(null)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close" size={14} color="#606060" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ maxHeight: MAX_LIST_H }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {selectedGroup.pins.map((pin, i) => {
              const l1 = (pin.tags ?? []).find((t) => !t.parent_id)?.name;
              return (
                <TouchableOpacity
                  key={pin.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    selectGroup(null);
                    router.push(`/(app)/pin/${pin.id}` as any);
                  }}
                >
                  {i > 0 && <View style={styles.divider} />}
                  <View style={{ ...styles.row, gap: 6 }}>
                    {l1 && <TagIcon tagName={l1} size={12} color="#909090" />}
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#f5f5f5', flex: 1 }} numberOfLines={1}>
                      {pin.description}
                    </Text>
                  </View>
                  <View style={{ ...styles.row, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: '#909090', flex: 1 }} numberOfLines={1}>
                      #{pin.collection_number} · {pin.city}, {pin.country}
                    </Text>
                    <Ionicons name="chevron-forward" size={11} color="#e8c97e" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

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
