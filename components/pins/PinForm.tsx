import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePinForm, COLOR_OPTIONS } from '../../hooks/usePinForm';
import { useTags } from '../../hooks/useTags';
import TagPicker from './TagPicker';
import PlaceSearch from './PlaceSearch';

interface PinFormProps {
  pinId?: string;
}

export default function PinForm({ pinId }: PinFormProps) {
  const insets = useSafeAreaInsets();
  const {
    form,
    setField,
    toggleColor,
    pickImage,
    submit,
    errors,
    initialLoading,
    submitting,
    submitError,
    previewImageUri,
  } = usePinForm(pinId);
  const { tagGroups, standaloneTags, loading: tagsLoading } = useTags();

  function handleToggleTag(tagId: string) {
    const l1Group = tagGroups.find((g) => g.category.id === tagId);
    const l2Group = tagGroups.find((g) => g.subcategories.some((s) => s.id === tagId));
    const isStandalone = standaloneTags.some((t) => t.id === tagId);
    let newIds = [...form.selectedTagIds];

    if (l1Group) {
      if (newIds.includes(tagId)) {
        const childIds = l1Group.subcategories.map((s) => s.id);
        newIds = newIds.filter((id) => id !== tagId && !childIds.includes(id));
      } else {
        newIds = [...newIds, tagId];
      }
    } else if (l2Group) {
      const parentId = l2Group.category.id;
      if (newIds.includes(tagId)) {
        const remainingSiblings = l2Group.subcategories.filter(
          (s) => s.id !== tagId && newIds.includes(s.id)
        );
        newIds = newIds.filter((id) => id !== tagId);
        if (remainingSiblings.length === 0) {
          newIds = newIds.filter((id) => id !== parentId);
        }
      } else {
        if (!newIds.includes(parentId)) newIds = [...newIds, parentId];
        newIds = [...newIds, tagId];
      }
    } else if (isStandalone) {
      // Standalone L2: simple toggle, no parent side-effect
      newIds = newIds.includes(tagId)
        ? newIds.filter((id) => id !== tagId)
        : [...newIds, tagId];
    }

    setField('selectedTagIds', newIds);
  }

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#e8c97e" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Image picker */}
        <TouchableOpacity
          onPress={pickImage}
          className="mx-4 mt-4 h-48 bg-surface-card rounded-2xl items-center justify-center overflow-hidden"
        >
          {previewImageUri ? (
            <Image source={{ uri: previewImageUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Ionicons name="camera-outline" size={36} color="#606060" />
              <Text className="text-text-muted text-sm mt-2">Añadir foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {previewImageUri && (
          <TouchableOpacity onPress={pickImage} className="mx-4 mt-1.5 flex-row items-center">
            <Ionicons name="refresh-outline" size={14} color="#b89a5a" />
            <Text className="text-accent-muted text-xs ml-1">Cambiar foto</Text>
          </TouchableOpacity>
        )}

        <View className="px-4 mt-5" style={{ gap: 16 }}>
          {/* Description */}
          <View>
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
              Descripción *
            </Text>
            <TextInput
              className={`bg-surface-card rounded-xl px-4 py-3 text-text-primary text-sm ${
                errors.description ? 'border border-danger' : ''
              }`}
              placeholder="Ej. Pin Tokio 1964 Olimpiadas"
              placeholderTextColor="#606060"
              value={form.description}
              onChangeText={(v) => setField('description', v)}
              maxLength={100}
            />
            {errors.description ? (
              <Text className="text-danger text-xs mt-1">{errors.description}</Text>
            ) : (
              <Text className="text-text-muted text-xs mt-1 text-right">
                {form.description.length}/100
              </Text>
            )}
          </View>

          {/* Country */}
          <View>
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
              País *
            </Text>
            <TextInput
              className={`bg-surface-card rounded-xl px-4 py-3 text-text-primary text-sm ${
                errors.country ? 'border border-danger' : ''
              }`}
              placeholder="Ej. España"
              placeholderTextColor="#606060"
              value={form.country}
              onChangeText={(v) => setField('country', v)}
            />
            {errors.country && (
              <Text className="text-danger text-xs mt-1">{errors.country}</Text>
            )}
          </View>

          {/* City + Region */}
          <View className="flex-row" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                Ciudad *
              </Text>
              <TextInput
                className={`bg-surface-card rounded-xl px-4 py-3 text-text-primary text-sm ${
                  errors.city ? 'border border-danger' : ''
                }`}
                placeholder="Ej. Madrid"
                placeholderTextColor="#606060"
                value={form.city}
                onChangeText={(v) => setField('city', v)}
              />
              {errors.city && (
                <Text className="text-danger text-xs mt-1">{errors.city}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                Región
              </Text>
              <TextInput
                className="bg-surface-card rounded-xl px-4 py-3 text-text-primary text-sm"
                placeholder="Ej. Cataluña"
                placeholderTextColor="#606060"
                value={form.region}
                onChangeText={(v) => setField('region', v)}
              />
            </View>
          </View>

          {/* Year + Commemorative */}
          <View className="flex-row items-start" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                Año de adquisición *
              </Text>
              <TextInput
                className={`bg-surface-card rounded-xl px-4 py-3 text-text-primary text-sm ${
                  errors.acquired_year ? 'border border-danger' : ''
                }`}
                placeholder="Ej. 1998"
                placeholderTextColor="#606060"
                value={form.acquired_year}
                onChangeText={(v) => setField('acquired_year', v)}
                keyboardType="numeric"
                maxLength={4}
              />
              {errors.acquired_year && (
                <Text className="text-danger text-xs mt-1">{errors.acquired_year}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                Conmemorativo
              </Text>
              <View className="bg-surface-card rounded-xl px-4 h-[46px] flex-row items-center justify-between">
                <Text className="text-text-secondary text-sm">
                  {form.is_commemorative ? 'Sí' : 'No'}
                </Text>
                <Switch
                  value={form.is_commemorative}
                  onValueChange={(v) => setField('is_commemorative', v)}
                  trackColor={{ false: '#242424', true: '#b89a5a' }}
                  thumbColor={form.is_commemorative ? '#e8c97e' : '#606060'}
                />
              </View>
            </View>
          </View>

          {/* Map position */}
          <View>
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
              Posición en mapa
            </Text>
            <PlaceSearch
              value={
                form.mapLocationName
                  ? { name: form.mapLocationName, latitude: form.latitude!, longitude: form.longitude! }
                  : null
              }
              hasExistingCoords={!!(form.latitude && form.longitude && !form.mapLocationName)}
              existingLatitude={form.latitude}
              existingLongitude={form.longitude}
              onChange={(place) => {
                setField('mapLocationName', place?.name ?? null);
                setField('latitude', place?.latitude ?? null);
                setField('longitude', place?.longitude ?? null);
              }}
            />
          </View>

          {/* Material */}
          <View>
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
              Material
            </Text>
            <TextInput
              className="bg-surface-card rounded-xl px-4 py-3 text-text-primary text-sm"
              placeholder="Ej. Esmalte, Metal, Madera..."
              placeholderTextColor="#606060"
              value={form.material}
              onChangeText={(v) => setField('material', v)}
              maxLength={50}
            />
          </View>

          {/* Color */}
          <View>
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">
              Color
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {COLOR_OPTIONS.map((opt) => {
                const selected = form.color.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => toggleColor(opt.value)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: opt.hex,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? '#e8c97e' : '#2a2a2a',
                    }}
                  >
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={opt.value === 'blanco' || opt.value === 'amarillo' ? '#0f0f0f' : '#f5f5f5'}
                      />
                    )}
                    {opt.value === 'otro' && !selected && (
                      <Text style={{ fontSize: 14, color: '#f5f5f5', fontWeight: '600' }}>?</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {form.color.length > 0 && (
              <Text className="text-text-muted text-xs mt-2">
                {form.color.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
              </Text>
            )}
          </View>

          {/* Tags */}
          <View>
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">
              Etiquetas
            </Text>
            {tagsLoading ? (
              <ActivityIndicator color="#e8c97e" size="small" />
            ) : (
              <TagPicker
                tagGroups={tagGroups}
                standaloneTags={standaloneTags}
                selectedIds={form.selectedTagIds}
                onToggle={handleToggleTag}
              />
            )}
          </View>
        </View>

        {submitError && (
          <View className="mx-4 mt-4 bg-surface-card rounded-xl px-4 py-3">
            <Text className="text-danger text-sm">{submitError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Submit button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 bg-surface border-t border-surface-elevated"
        style={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
      >
        <TouchableOpacity
          onPress={submit}
          disabled={submitting}
          className={`rounded-2xl py-4 items-center ${submitting ? 'bg-accent-muted' : 'bg-accent'}`}
        >
          {submitting ? (
            <ActivityIndicator color="#0f0f0f" />
          ) : (
            <Text className="text-surface font-semibold text-base">Guardar elemento</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
