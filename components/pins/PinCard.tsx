import { useRef, memo } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '../../lib/types';
import TagIcon from '../ui/TagIcon';

const SWIPE_THRESHOLD = 80;
const MAX_TRANSLATE = 100;

interface PinCardProps {
  pin: Item;
  onPress: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function PinCard({ pin, onPress, onEdit, onDelete }: PinCardProps) {
  const location = [pin.city, pin.country].filter(Boolean).join(' · ');
  const tags = pin.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const extraCount = tags.length - visibleTags.length;

  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 15,
      onPanResponderMove: (_, gs) => {
        const clamped = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, gs.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          onEdit(pin.id);
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          onDelete(pin.id);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const editOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const deleteOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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
          { opacity: editOpacity },
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
          { opacity: deleteOpacity },
        ]}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </Animated.View>

      {/* Card */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
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
    </View>
  );
}

export default memo(PinCard);
