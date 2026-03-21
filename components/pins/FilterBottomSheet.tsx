import { memo, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Pressable,
  TextInput,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TagIcon from '../ui/TagIcon';
import { TAG_ICONS } from '../../lib/tagIcons';
import { TagGroup } from '../../hooks/useTags';
import { FilterState, Pin } from '../../lib/types';

const EMPTY_FILTERS: FilterState = { l1: null, l2: null, country: null, city: null, year: null };

interface Props {
  visible: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
  pins: Pin[];
  tagGroups: TagGroup[];
  search: string;
}

function applyFilters(
  pins: Pin[],
  search: string,
  l1: string | null,
  l2: string | null,
  country: string | null,
  city: string | null,
  year: number | null
): Pin[] {
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
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}

function Chip({ label, active, onPress, icon }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-3 py-1.5 rounded-full ${
        active ? 'bg-accent' : 'bg-surface-card'
      }`}
    >
      {icon && <View className="mr-1.5">{icon}</View>}
      <Text className={`text-xs font-medium ${active ? 'text-surface' : 'text-text-secondary'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider px-4 mb-2">
        {title}
      </Text>
      {children}
    </View>
  );
}

function SearchInput({
  value,
  placeholder,
  onChangeText,
  onClear,
}: {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}) {
  return (
    <View className="mx-4 mb-2 flex-row items-center bg-surface-card rounded-xl px-3">
      <Ionicons name="search" size={14} color="#606060" />
      <TextInput
        className="flex-1 ml-2 py-2.5 text-text-primary text-sm"
        placeholder={placeholder}
        placeholderTextColor="#606060"
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={14} color="#606060" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function FilterBottomSheet({
  visible,
  filters,
  onFiltersChange,
  onClose,
  pins,
  tagGroups,
  search,
}: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;

  // Pre-render the sheet via InteractionManager so native views exist before first open.
  // Falls back to rendering on open if user taps before pre-warm completes.
  const [isPrewarmed, setIsPrewarmed] = useState(false);
  const isRendered = isPrewarmed || visible;

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => setIsPrewarmed(true));
    return () => handle.cancel();
  }, []);

  // Draft state — local to the sheet. onFiltersChange fires once on close, not on every tap.
  const [draft, setDraft] = useState<FilterState>(EMPTY_FILTERS);
  const draftRef = useRef<FilterState>(EMPTY_FILTERS);
  const [countryInput, setCountryInput] = useState('');
  const [cityInput, setCityInput] = useState('');

  function updateDraft(f: FilterState) {
    draftRef.current = f;
    setDraft(f);
  }

  useEffect(() => {
    if (visible) {
      updateDraft(filters);
      setCountryInput(filters.country ?? '');
      setCityInput(filters.city ?? '');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      onFiltersChange(draftRef.current);
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const { l1, l2, country, city, year } = draft;

  const pinsForL1 = useMemo(
    () => applyFilters(pins, search, null, l2, country, city, year),
    [pins, search, l2, country, city, year]
  );
  const pinsForL2 = useMemo(
    () => applyFilters(pins, search, l1, null, country, city, year),
    [pins, search, l1, country, city, year]
  );
  const pinsForCountry = useMemo(
    () => applyFilters(pins, search, l1, l2, null, city, year),
    [pins, search, l1, l2, city, year]
  );
  const pinsForCity = useMemo(
    () => applyFilters(pins, search, l1, l2, country, null, year),
    [pins, search, l1, l2, country, year]
  );
  const pinsForYear = useMemo(
    () => applyFilters(pins, search, l1, l2, country, city, null),
    [pins, search, l1, l2, country, city]
  );

  const availableL1Names = useMemo(() => {
    const set = new Set<string>();
    pinsForL1.forEach((p) =>
      (p.tags ?? []).filter((t) => !t.parent_id).forEach((t) => set.add(t.name))
    );
    return set;
  }, [pinsForL1]);

  const availableL2Names = useMemo(() => {
    const set = new Set<string>();
    pinsForL2.forEach((p) =>
      (p.tags ?? []).filter((t) => t.parent_id).forEach((t) => set.add(t.name))
    );
    return set;
  }, [pinsForL2]);

  const availableTagGroups = useMemo(
    () => tagGroups.filter((g) => availableL1Names.has(g.category.name)),
    [tagGroups, availableL1Names]
  );

  const selectedL1Group = tagGroups.find((g) => g.category.name === l1);
  const subcategories = useMemo(() => {
    const source = l1
      ? (selectedL1Group?.subcategories ?? [])
      : tagGroups.flatMap((g) => g.subcategories);
    return source.filter((s) => availableL2Names.has(s.name));
  }, [l1, selectedL1Group, tagGroups, availableL2Names]);

  const distinctCountries = useMemo(() => {
    const set = new Set(pinsForCountry.map((p) => p.country).filter(Boolean) as string[]);
    return [...set].sort();
  }, [pinsForCountry]);

  const distinctCities = useMemo(() => {
    const set = new Set(pinsForCity.map((p) => p.city).filter(Boolean) as string[]);
    return [...set].sort();
  }, [pinsForCity]);

  const distinctYears = useMemo(() => {
    const set = new Set(pinsForYear.map((p) => p.acquired_year).filter(Boolean) as number[]);
    return [...set].sort((a, b) => b - a);
  }, [pinsForYear]);

  // Only show country/city chips when user has typed or a value is already selected.
  // Avoids creating 200+ native views on initial render.
  const showCountryChips = countryInput.length > 0 || country !== null;
  const showCityChips = cityInput.length > 0 || city !== null;

  const countrySuggestions = useMemo(() => {
    if (!countryInput.trim()) return distinctCountries;
    const q = countryInput.toLowerCase();
    return distinctCountries.filter((c) => c.toLowerCase().includes(q));
  }, [distinctCountries, countryInput]);

  const citySuggestions = useMemo(() => {
    if (!cityInput.trim()) return distinctCities;
    const q = cityInput.toLowerCase();
    return distinctCities.filter((c) => c.toLowerCase().includes(q));
  }, [distinctCities, cityInput]);

  const activeCount = [l1, l2, country, city, year].filter(Boolean).length;

  function setL1(name: string | null) {
    const newL1Group = tagGroups.find((g) => g.category.name === name);
    const l2StillValid = l2 !== null && newL1Group?.subcategories.some((s) => s.name === l2);
    updateDraft({ ...draft, l1: name, l2: l2StillValid ? l2 : null });
  }

  function setL2(name: string | null) {
    updateDraft({ ...draft, l2: name });
  }

  function selectCountry(value: string) {
    const next = country === value ? null : value;
    setCountryInput(next ?? '');
    updateDraft({ ...draft, country: next });
  }

  function onCountryType(text: string) {
    setCountryInput(text);
    if (country) updateDraft({ ...draft, country: null });
  }

  function clearCountry() {
    setCountryInput('');
    updateDraft({ ...draft, country: null });
  }

  function selectCity(value: string) {
    const next = city === value ? null : value;
    setCityInput(next ?? '');
    updateDraft({ ...draft, city: next });
  }

  function onCityType(text: string) {
    setCityInput(text);
    if (city) updateDraft({ ...draft, city: null });
  }

  function clearCity() {
    setCityInput('');
    updateDraft({ ...draft, city: null });
  }

  function setYear(value: number | null) {
    updateDraft({ ...draft, year: value });
  }

  function clearAll() {
    setCountryInput('');
    setCityInput('');
    updateDraft(EMPTY_FILTERS);
  }

  if (!isRendered) return null;

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      {/* Backdrop — only interactive and visible when sheet is open */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
        }}
        onPress={onClose}
      />

      <Animated.View
        style={[{ transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 }]}
        className="absolute bottom-0 left-0 right-0 bg-surface-elevated rounded-t-2xl"
      >
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1 rounded-full bg-surface-card" />
        </View>

        <View className="flex-row items-center justify-between px-4 pt-1 pb-3">
          <Text className="text-text-primary text-base font-semibold">Filtrar</Text>
          {activeCount > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text className="text-accent text-sm">Limpiar todo</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
          {availableTagGroups.length > 0 && (
            <Section title="Categoría">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {availableTagGroups.map((g) => (
                  <Chip
                    key={g.category.id}
                    label={g.category.name}
                    active={l1 === g.category.name}
                    onPress={() => setL1(l1 === g.category.name ? null : g.category.name)}
                    icon={
                      TAG_ICONS[g.category.name] ? (
                        <TagIcon
                          tagName={g.category.name}
                          size={12}
                          color={l1 === g.category.name ? '#0f0f0f' : '#909090'}
                        />
                      ) : undefined
                    }
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          {subcategories.length > 0 && (
            <Section title="Subcategoría">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {subcategories.map((sub) => (
                  <Chip
                    key={sub.id}
                    label={sub.name}
                    active={l2 === sub.name}
                    onPress={() => setL2(l2 === sub.name ? null : sub.name)}
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          {distinctCountries.length > 0 && (
            <Section title="País">
              <SearchInput
                value={countryInput}
                placeholder="Buscar país..."
                onChangeText={onCountryType}
                onClear={clearCountry}
              />
              {showCountryChips && countrySuggestions.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {countrySuggestions.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      active={country === c}
                      onPress={() => selectCountry(c)}
                    />
                  ))}
                </ScrollView>
              )}
            </Section>
          )}

          {distinctCities.length > 0 && (
            <Section title="Ciudad">
              <SearchInput
                value={cityInput}
                placeholder="Buscar ciudad..."
                onChangeText={onCityType}
                onClear={clearCity}
              />
              {showCityChips && citySuggestions.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {citySuggestions.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      active={city === c}
                      onPress={() => selectCity(c)}
                    />
                  ))}
                </ScrollView>
              )}
            </Section>
          )}

          {distinctYears.length > 0 && (
            <Section title="Año">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {distinctYears.map((y) => (
                  <Chip
                    key={y}
                    label={String(y)}
                    active={year === y}
                    onPress={() => setYear(year === y ? null : y)}
                  />
                ))}
              </ScrollView>
            </Section>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export default memo(FilterBottomSheet);
