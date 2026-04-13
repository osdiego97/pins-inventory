import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useUserSettingsContext } from '../../contexts/UserSettingsContext';
import { useThemeColors } from '../../contexts/ThemeContext';

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

const THEME_OPTIONS: { label: string; value: 'dark' | 'light' | 'system' }[] = [
  { label: 'Oscuro', value: 'dark' },
  { label: 'Claro', value: 'light' },
  { label: 'Sistema', value: 'system' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, loading, saveSettings } = useUserSettingsContext();
  const colors = useThemeColors();
  const [collectionName, setCollectionName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const currentName = settings?.collection_name ?? '';
  const currentIcon = (settings?.collection_icon as CollectionIcon | null) ?? 'albums-outline';
  const currentTheme = settings?.theme ?? 'dark';

  async function handleSaveName() {
    const name = collectionName.trim();
    if (!name) { setNameError('El nombre no puede estar vacío.'); return; }
    if (name.length > 50) { setNameError('Máximo 50 caracteres.'); return; }
    setSavingName(true);
    await saveSettings({ collection_name: name });
    setCollectionName('');
    setSavingName(false);
  }

  async function handleIconSelect(icon: CollectionIcon) {
    await saveSettings({ collection_icon: icon });
  }

  async function handleThemeSelect(theme: 'dark' | 'light' | 'system') {
    await saveSettings({ theme });
  }

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-text-primary text-lg font-semibold flex-1">Ajustes</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
      >
        {/* Collection section */}
        <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-3 mt-4">
          Colección
        </Text>
        <View className="bg-surface-card rounded-2xl overflow-hidden mb-4">
          {/* Rename */}
          <View className="px-4 pt-4 pb-3">
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-2">
              Nombre
            </Text>
            <Text className="text-text-primary text-base font-semibold mb-3">{currentName}</Text>
            <TextInput
              className={`bg-surface-elevated rounded-xl px-4 py-3 text-text-primary text-sm ${
                nameError ? 'border border-danger' : ''
              }`}
              placeholder="Nuevo nombre..."
              placeholderTextColor={colors.textMuted}
              value={collectionName}
              onChangeText={(v) => { setCollectionName(v); setNameError(null); }}
              maxLength={50}
            />
            {nameError && <Text className="text-danger text-xs mt-1">{nameError}</Text>}
            <TouchableOpacity
              onPress={handleSaveName}
              disabled={savingName || !collectionName.trim()}
              className={`mt-3 rounded-xl py-3 items-center ${
                savingName || !collectionName.trim() ? 'bg-accent-muted' : 'bg-accent'
              }`}
            >
              {savingName ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text className="text-surface text-sm font-semibold">Guardar nombre</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="h-px bg-surface-elevated" />

          {/* Icon */}
          <View className="px-4 py-4">
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">
              Ícono
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {COLLECTION_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => handleIconSelect(icon)}
                  className={`w-12 h-12 rounded-xl items-center justify-center ${
                    currentIcon === icon ? 'bg-accent' : 'bg-surface-elevated'
                  }`}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={currentIcon === icon ? colors.surface : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Categories */}
        <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-3">
          Categorías
        </Text>
        <TouchableOpacity
          className="bg-surface-card rounded-2xl px-4 py-4 flex-row items-center justify-between mb-4"
          onPress={() => router.push('/(app)/categories' as any)}
        >
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <Ionicons name="pricetags-outline" size={20} color={colors.textSecondary} />
            <Text className="text-text-primary text-base">Gestionar categorías</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Theme */}
        <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-3">
          Tema
        </Text>
        <View className="bg-surface-card rounded-2xl overflow-hidden mb-6">
          {THEME_OPTIONS.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleThemeSelect(option.value)}
              activeOpacity={0.7}
              className="px-4 py-4 flex-row items-center justify-between"
            >
              <Text className="text-text-primary text-base">{option.label}</Text>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                {currentTheme === option.value && (
                  <Ionicons name="checkmark" size={18} color={colors.accent} />
                )}
              </View>
              {idx < THEME_OPTIONS.length - 1 && (
                <View className="absolute bottom-0 left-4 right-4 h-px bg-surface-elevated" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="bg-surface-card rounded-2xl px-4 py-4 flex-row items-center justify-center"
          style={{ gap: 10 }}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text className="text-danger text-base font-medium">Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
