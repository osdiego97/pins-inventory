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
import PinCard from '../../components/pins/PinCard';

export default function CollectionScreen() {
  const { pins, loading, error, refetch } = usePins();
  const { confirmDelete } = usePinDelete(refetch);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return pins;
    const q = search.toLowerCase();
    return pins.filter(
      (p) =>
        p.description.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
    );
  }, [pins, search]);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-text-primary text-2xl font-bold">Mi Colección</Text>
        {!loading && (
          <Text className="text-text-muted text-sm mt-0.5">{pins.length} pins</Text>
        )}
      </View>

      {/* Search bar */}
      <View className="mx-4 mb-3 flex-row items-center bg-surface-card rounded-xl px-3">
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
            {search
              ? 'No hay pins que coincidan con la búsqueda.'
              : 'Aún no tienes pins. ¡Añade el primero!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PinCard
                pin={item}
                onPress={(id) => router.push(`/(app)/pin/${id}` as any)}
                onEdit={(id) => router.push(`/(app)/pin/edit/${id}` as any)}
                onDelete={confirmDelete}
              />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 80,
          }}
          showsVerticalScrollIndicator={false}
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
    </View>
  );
}
