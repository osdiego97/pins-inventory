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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TagIcon from '../ui/TagIcon';
import { normalize } from '../../lib/utils';
import { TAG_ICONS } from '../../lib/tagIcons';
import { TagGroup } from '../../hooks/useTags';
import { FilterState, Item, Tag } from '../../lib/types';
import { COLOR_OPTIONS } from '../../hooks/usePinForm';

const EMPTY_FILTERS: FilterState = { l1: [], l2: [], country: null, city: null, year: null, material: [], color: [] };

interface Props {
  visible: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
  pins: Item[];
  tagGroups: TagGroup[];
  standaloneTags?: Tag[];
  search: string;
}

function applyFilters(
  pins: Item[],
  search: string,
  l1: string[],
  l2: string[],
  country: string | null,
  city: string | null,
  year: number | null,
  material: string[] = [],
  color: string[] = []
): Item[] {
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
        (p.collection_number !== null && String(p.collection_number).includes(q))
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
  standaloneTags = [],
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

  const { l1, l2, country, city, year, material, color } = draft;

  const pinsForCountry = useMemo(
    () => applyFilters(pins, search, l1, l2, null, city, year, material, color),
    [pins, search, l1, l2, city, year, material, color]
  );
  const pinsForCity = useMemo(
    () => applyFilters(pins, search, l1, l2, country, null, year, material, color),
    [pins, search, l1, l2, country, year, material, color]
  );
  const pinsForYear = useMemo(
    () => applyFilters(pins, search, l1, l2, country, city, null, material, color),
    [pins, search, l1, l2, country, city, material, color]
  );

  const availableTagGroups = tagGroups;

  const subcategories = useMemo(
    () => tagGroups.flatMap((g) => g.subcategories),
    [tagGroups]
  );

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
    const q = normalize(countryInput);
    return distinctCountries.filter((c) => normalize(c).includes(q));
  }, [distinctCountries, countryInput]);

  const citySuggestions = useMemo(() => {
    if (!cityInput.trim()) return distinctCities;
    const q = normalize(cityInput);
    return distinctCities.filter((c) => normalize(c).includes(q));
  }, [distinctCities, cityInput]);

  const distinctMaterials = useMemo(() => {
    const set = new Set(pins.map((p) => p.material).filter(Boolean) as string[]);
    return [...set].sort();
  }, [pins]);

  const activeCount = [l1.length > 0, l2.length > 0, country, city, year, material.length > 0, color.length > 0].filter(Boolean).length;

  function setL1(name: string) {
    const newL1 = l1.includes(name) ? l1.filter((n) => n !== name) : [...l1, name];
    updateDraft({ ...draft, l1: newL1 });
  }

  function setL2(name: string) {
    const isRemoving = l2.includes(name);
    const newL2 = isRemoving ? l2.filter((n) => n !== name) : [...l2, name];
    let newL1 = l1;
    if (!isRemoving) {
      const parentGroup = tagGroups.find((g) => g.subcategories.some((s) => s.name === name));
      if (parentGroup && !l1.includes(parentGroup.category.name)) {
        newL1 = [...l1, parentGroup.category.name];
      }
    }
    updateDraft({ ...draft, l1: newL1, l2: newL2 });
  }

  function toggleMaterial(value: string) {
    const next = material.includes(value) ? material.filter((m) => m !== value) : [...material, value];
    updateDraft({ ...draft, material: next });
  }

  function toggleColor(value: string) {
    const next = color.includes(value) ? color.filter((c) => c !== value) : [...color, value];
    updateDraft({ ...draft, color: next });
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
    <KeyboardAvoidingView
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

      {/* Sheet — sits at bottom of flex container; KAV shrinks it up when keyboard shows */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
      <Animated.View
        style={[{ transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 }]}
        className="bg-surface-elevated rounded-t-2xl"
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
                    active={l1.includes(g.category.name)}
                    onPress={() => setL1(g.category.name)}
                    icon={
                      (g.category.icon || TAG_ICONS[g.category.name]) ? (
                        <TagIcon
                          tagName={g.category.name}
                          tagIcon={g.category.icon}
                          size={12}
                          color={l1.includes(g.category.name) ? '#0f0f0f' : '#909090'}
                        />
                      ) : undefined
                    }
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          {(subcategories.length > 0 || standaloneTags.length > 0) && (
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
                    active={l2.includes(sub.name)}
                    onPress={() => setL2(sub.name)}
                  />
                ))}
                {standaloneTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    active={l2.includes(tag.name)}
                    onPress={() => setL2(tag.name)}
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

          {distinctMaterials.length > 0 && (
            <Section title="Material">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {distinctMaterials.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    active={material.includes(m)}
                    onPress={() => toggleMaterial(m)}
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          <Section title="Color">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {COLOR_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  active={color.includes(opt.value)}
                  onPress={() => toggleColor(opt.value)}
                  icon={
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        overflow: 'hidden',
                        borderWidth: opt.value === 'blanco' ? 1 : 0,
                        borderColor: '#606060',
                        ...(opt.hex !== 'rainbow' && { backgroundColor: opt.hex }),
                      }}
                    >
                      {opt.hex === 'rainbow' && (
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                          {['#e05c5c', '#e8874f', '#e8c97e', '#5ce07a', '#5c8de0', '#9b5de5'].map((c, i) => (
                            <View key={i} style={{ flex: 1, backgroundColor: c }} />
                          ))}
                        </View>
                      )}
                    </View>
                  }
                />
              ))}
            </ScrollView>
          </Section>
        </ScrollView>
      </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default memo(FilterBottomSheet);
