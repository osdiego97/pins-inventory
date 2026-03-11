import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePinDetail } from '../../../hooks/usePinDetail';

export default function PinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pin, loading, error } = usePinDetail(id);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#f5f5f5" />
          </TouchableOpacity>
          <Text className="text-text-primary text-lg font-semibold flex-1" numberOfLines={1}>
            {pin?.description ?? ''}
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#e8c97e" />
          </View>
        ) : error || !pin ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-text-secondary text-center">
              {error ?? 'No se encontró el pin.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            {/* Photo placeholder */}
            <View className="mx-4 mt-2 h-56 bg-surface-card rounded-2xl items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#606060" />
              <Text className="text-text-muted text-sm mt-2">Sin foto</Text>
            </View>

            {/* Details */}
            <View className="mx-4 mt-4">
              <Text className="text-text-primary text-xl font-bold">{pin.description}</Text>

              {/* Location */}
              {(pin.city || pin.country) && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="location-outline" size={16} color="#a0a0a0" />
                  <Text className="text-text-secondary text-sm ml-1">
                    {[pin.city, pin.region, pin.country].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              )}

              {/* Year + Commemorative */}
              <View className="flex-row items-center mt-2" style={{ gap: 8 }}>
                {pin.acquired_year && (
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#a0a0a0" />
                    <Text className="text-text-secondary text-sm ml-1">{pin.acquired_year}</Text>
                  </View>
                )}
                {pin.is_commemorative && (
                  <View className="bg-surface-elevated rounded-full px-3 py-1">
                    <Text className="text-accent text-xs font-medium">Conmemorativo</Text>
                  </View>
                )}
              </View>

              {/* Tags */}
              {(pin.tags ?? []).length > 0 && (
                <View className="mt-4">
                  <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
                    Etiquetas
                  </Text>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {pin.tags!.map((tag) => (
                      <View key={tag.id} className="bg-surface-card rounded-full px-3 py-1.5">
                        <Text className="text-text-secondary text-sm">{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
