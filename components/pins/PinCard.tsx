import { View, Text, TouchableOpacity } from 'react-native';
import { Pin } from '../../lib/types';

interface PinCardProps {
  pin: Pin;
  onPress: (id: string) => void;
}

export default function PinCard({ pin, onPress }: PinCardProps) {
  const location = [pin.city, pin.country].filter(Boolean).join(' · ');
  const tags = pin.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const extraCount = tags.length - visibleTags.length;

  return (
    <TouchableOpacity
      className="bg-surface-card rounded-2xl p-4 mb-3"
      onPress={() => onPress(pin.id)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <Text
          className="text-text-primary text-base font-semibold flex-1 mr-2"
          numberOfLines={2}
        >
          {pin.description}
        </Text>
        <View className="items-end" style={{ gap: 4 }}>
          {pin.collection_number != null && (
            <Text className="text-text-muted text-xs">#{pin.collection_number}</Text>
          )}
          {pin.is_commemorative && (
            <View className="bg-surface-elevated rounded-full px-2 py-0.5">
              <Text className="text-accent text-xs font-medium">Conm.</Text>
            </View>
          )}
        </View>
      </View>

      {location ? (
        <Text className="text-text-secondary text-sm mt-1">{location}</Text>
      ) : null}

      {visibleTags.length > 0 && (
        <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
          {visibleTags.map((tag) => (
            <View key={tag.id} className="bg-surface-elevated rounded-full px-2.5 py-1">
              <Text className="text-text-muted text-xs">{tag.name}</Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View className="bg-surface-elevated rounded-full px-2.5 py-1">
              <Text className="text-text-muted text-xs">+{extraCount}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
