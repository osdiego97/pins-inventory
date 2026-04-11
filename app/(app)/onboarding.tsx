import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserSettings } from '../../hooks/useUserSettings';

const COLLECTION_ICONS = [
  'albums-outline',
  'star-outline',
  'heart-outline',
  'trophy-outline',
  'planet-outline',
  'paw-outline',
  'football-outline',
  'musical-notes-outline',
  'camera-outline',
  'book-outline',
  'car-outline',
  'leaf-outline',
] as const;

type CollectionIcon = (typeof COLLECTION_ICONS)[number];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { saveSettings } = useUserSettings();
  const [collectionName, setCollectionName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<CollectionIcon>('albums-outline');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    const name = collectionName.trim();
    if (!name) {
      setError('El nombre de la colección es obligatorio.');
      return;
    }
    if (name.length > 50) {
      setError('Máximo 50 caracteres.');
      return;
    }

    setSaving(true);
    const { error: saveError } = await saveSettings({
      collection_name: name,
      collection_icon: selectedIcon,
      theme: 'dark',
    });

    if (saveError) {
      setError('No se pudo guardar. Inténtalo de nuevo.');
      setSaving(false);
      return;
    }

    router.replace('/(app)/' as any);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View className="px-6" style={{ paddingTop: insets.top + 24 }}>
          {/* Header */}
          <Text className="text-text-primary text-3xl font-bold mb-2">Bienvenido a Vitrina</Text>
          <Text className="text-text-secondary text-base mb-8">
            Ponle nombre a tu colección para empezar.
          </Text>

          {/* Collection name */}
          <View className="mb-6">
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-2">
              Nombre de la colección *
            </Text>
            <TextInput
              className={`bg-surface-card rounded-xl px-4 py-3 text-text-primary text-base ${
                error ? 'border border-danger' : ''
              }`}
              placeholder="Ej. Mi Colección de Viaje"
              placeholderTextColor="#606060"
              value={collectionName}
              onChangeText={(v) => {
                setCollectionName(v);
                setError(null);
              }}
              maxLength={50}
            />
            {error ? (
              <Text className="text-danger text-xs mt-1">{error}</Text>
            ) : (
              <Text className="text-text-muted text-xs mt-1 text-right">
                {collectionName.length}/50
              </Text>
            )}
          </View>

          {/* Icon picker */}
          <View className="mb-8">
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">
              Ícono de la colección
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {COLLECTION_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  className={`w-14 h-14 rounded-2xl items-center justify-center ${
                    selectedIcon === icon ? 'bg-accent' : 'bg-surface-card'
                  }`}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={selectedIcon === icon ? '#0f0f0f' : '#a0a0a0'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info note */}
          <View className="bg-surface-card rounded-xl px-4 py-3 flex-row items-start" style={{ gap: 10 }}>
            <Ionicons name="information-circle-outline" size={18} color="#606060" style={{ marginTop: 1 }} />
            <Text className="text-text-muted text-sm flex-1">
              Podrás configurar las categorías desde Ajustes después de empezar.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 bg-surface border-t border-surface-elevated"
        style={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
      >
        <TouchableOpacity
          onPress={handleComplete}
          disabled={saving || !collectionName.trim()}
          className={`rounded-2xl py-4 items-center ${
            saving || !collectionName.trim() ? 'bg-accent-muted' : 'bg-accent'
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#0f0f0f" />
          ) : (
            <Text className="text-surface font-semibold text-base">Empezar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
