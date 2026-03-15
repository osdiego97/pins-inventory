import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Pin } from '../../lib/types';
import TagIcon from '../ui/TagIcon';

const SWIPE_THRESHOLD = 80;
const MAX_TRANSLATE = 100;

interface PinCardProps {
  pin: Pin;
  onPress: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PinCard({ pin, onPress, onEdit, onDelete }: PinCardProps) {
  const location = [pin.city, pin.country].filter(Boolean).join(' · ');
  const tags = pin.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const extraCount = tags.length - visibleTags.length;

  const translateX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
        runOnJS(onEdit)(pin.id);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
        runOnJS(onDelete)(pin.id);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const editBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(1, translateX.value / SWIPE_THRESHOLD) : 0,
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(1, -translateX.value / SWIPE_THRESHOLD) : 0,
  }));

  return (
    <View style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden' }}>
      {/* Edit background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            inset: 0,
            backgroundColor: '#b89a5a',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: 20,
          },
          editBgStyle,
        ]}
      >
        <Ionicons name="pencil-outline" size={22} color="#0f0f0f" />
      </Animated.View>

      {/* Delete background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            inset: 0,
            backgroundColor: '#e05c5c',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingRight: 20,
          },
          deleteBgStyle,
        ]}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </Animated.View>

      {/* Card */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={cardStyle}>
          <TouchableOpacity
            className="bg-surface-card rounded-2xl p-4"
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
                  <Ionicons name="ribbon" size={16} color="#e8c97e" />
                )}
              </View>
            </View>

            {location ? (
              <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
                <Ionicons name="location-outline" size={13} color="#a0a0a0" />
                <Text className="text-text-secondary text-sm">{location}</Text>
              </View>
            ) : null}
            {pin.acquired_year ? (
              <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
                <Ionicons name="calendar-outline" size={13} color="#a0a0a0" />
                <Text className="text-text-secondary text-sm">{pin.acquired_year}</Text>
              </View>
            ) : null}

            {visibleTags.length > 0 && (
              <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
                {visibleTags.map((tag) => (
                  <View
                    key={tag.id}
                    className="bg-surface-elevated rounded-full px-2.5 py-1 flex-row items-center"
                    style={{ gap: 4 }}
                  >
                    {!tag.parent_id && (
                      <TagIcon tagName={tag.name} size={11} color="#606060" />
                    )}
                    <Text className="text-text-muted text-xs">
                      {tag.parent_id ? tag.name : tag.name.toUpperCase()}
                    </Text>
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
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
