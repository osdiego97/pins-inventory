import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { usePinDetail } from '../../../hooks/usePinDetail';
import { usePinDelete } from '../../../hooks/usePinDelete';
import { getSignedImageUrl } from '../../../lib/storage';
import TagIcon from '../../../components/ui/TagIcon';

export default function PinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pin, loading, error, refetch } = usePinDetail(id);
  const { confirmDelete } = usePinDelete(() => router.replace('/(app)/' as any));
  const insets = useSafeAreaInsets();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  useEffect(() => {
    if (pin?.image_url) {
      getSignedImageUrl(pin.image_url).then(setImageUrl);
    }
  }, [pin?.image_url]);

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
          {pin && (
            <View className="flex-row items-center" style={{ gap: 16 }}>
              <TouchableOpacity onPress={() => router.push(`/(app)/pin/edit/${pin.id}` as any)}>
                <Ionicons name="pencil-outline" size={20} color="#f5f5f5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(pin.id)}>
                <Ionicons name="trash-outline" size={20} color="#e05c5c" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#e8c97e" />
          </View>
        ) : error || !pin ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-text-secondary text-center">
              {error ?? 'No se encontró el elemento.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            {/* Photo */}
            <View className="mx-4 mt-2 h-56 bg-surface-card rounded-2xl overflow-hidden items-center justify-center">
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={48} color="#606060" />
                  <Text className="text-text-muted text-sm mt-2">Sin foto</Text>
                </>
              )}
            </View>

            {/* Details */}
            <View className="mx-4 mt-4">
              {pin.collection_number != null && (
                <Text className="text-text-muted text-sm mb-1">#{pin.collection_number}</Text>
              )}
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
                  <View className="bg-surface-elevated rounded-full px-3 py-1 flex-row items-center" style={{ gap: 5 }}>
                    <Ionicons name="ribbon" size={13} color="#e8c97e" />
                    <Text className="text-accent text-xs font-medium">Conmemorativo</Text>
                  </View>
                )}
              </View>

              {/* Material + Color */}
              {(pin.material || (pin.color ?? []).length > 0) && (
                <View className="mt-3" style={{ gap: 6 }}>
                  {pin.material && (
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Ionicons name="construct-outline" size={14} color="#a0a0a0" />
                      <Text className="text-text-secondary text-sm">{pin.material}</Text>
                    </View>
                  )}
                  {(pin.color ?? []).length > 0 && (
                    <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
                      <Ionicons name="color-palette-outline" size={14} color="#a0a0a0" />
                      <Text className="text-text-secondary text-sm">
                        {pin.color!.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Tags */}
              {(pin.tags ?? []).length > 0 && (
                <View className="mt-4">
                  <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
                    Etiquetas
                  </Text>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {pin.tags!.map((tag) => (
                      <View key={tag.id} className="bg-surface-card rounded-full px-3 py-1.5 flex-row items-center" style={{ gap: 5 }}>
                        {!tag.parent_id && (
                          <TagIcon tagName={tag.name} size={13} color="#a0a0a0" />
                        )}
                        <Text className="text-text-secondary text-sm">
                          {tag.parent_id ? tag.name : tag.name.toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Map */}
              {pin.latitude != null && pin.longitude != null && (
                <View collapsable={false} className="mt-4 rounded-2xl overflow-hidden" style={{ height: 160 }}>
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: pin.latitude,
                      longitude: pin.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    mapType="standard"
                    userInterfaceStyle="dark"
                  >
                    <Marker coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}>
                      <Ionicons name="location-sharp" size={32} color="#e8c97e" />
                    </Marker>
                  </MapView>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
