import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { L1Stat } from '../../hooks/useStats';
import { SEGMENT_COLORS } from '../../constants/chartColors';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const ANIMATION_DURATION = 800;

interface BarProps {
  ratio: number;
  color: string;
  progress: Animated.SharedValue<number>;
  containerWidth: number;
}

function AnimatedBar({ ratio, color, progress, containerWidth }: BarProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: containerWidth * ratio * progress.value,
  }));

  return (
    <View className="h-1.5 rounded-full overflow-hidden bg-surface" style={{ flex: 1 }}>
      <Animated.View
        style={[animatedStyle, { height: '100%', borderRadius: 4, backgroundColor: color }]}
      />
    </View>
  );
}

interface L2RowProps {
  name: string;
  count: number;
  maxCount: number;
  color: string;
  progress: Animated.SharedValue<number>;
  containerWidth: number;
}

function L2Row({ name, count, maxCount, color, progress, containerWidth }: L2RowProps) {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  return (
    <View className="flex-row items-center gap-2 py-1.5 pl-5">
      <Text className="text-text-muted text-xs w-28" numberOfLines={1}>
        {name}
      </Text>
      <AnimatedBar ratio={ratio} color={color} progress={progress} containerWidth={containerWidth} />
      <Text className="text-text-secondary text-xs w-8 text-right">{count}</Text>
    </View>
  );
}

interface Props {
  categories: L1Stat[];
  uncategorized: number;
}

export default function CategorySection({ categories, uncategorized }: Props) {
  const [expandedL1, setExpandedL1] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const maxCount = categories.length > 0 ? categories[0].count : 1;

  const toggle = useCallback((name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedL1((prev) => (prev === name ? null : name));
  }, []);

  const allRows = [
    ...categories,
    ...(uncategorized > 0 ? [{ name: 'Sin categoría', count: uncategorized, l2: [] }] : []),
  ];

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 32 - 36 - 32)}
      className="px-4"
    >
      {allRows.map((cat, i) => {
        const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
        const ratio = maxCount > 0 ? cat.count / maxCount : 0;
        const isExpanded = expandedL1 === cat.name;
        const hasL2 = cat.l2.length > 0;
        const l2Max = cat.l2.length > 0 ? cat.l2[0].count : 1;

        return (
          <View key={cat.name}>
            <TouchableOpacity
              onPress={() => hasL2 && toggle(cat.name)}
              activeOpacity={hasL2 ? 0.7 : 1}
              className="flex-row items-center gap-2 py-2.5"
            >
              {/* Color dot */}
              <View
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}
              />
              {/* Name */}
              <Text className="text-text-secondary text-sm w-28" numberOfLines={1}>
                {cat.name}
              </Text>
              {/* Bar */}
              {containerWidth > 0 && (
                <AnimatedBar
                  ratio={ratio}
                  color={color}
                  progress={progress}
                  containerWidth={containerWidth}
                />
              )}
              {/* Count */}
              <Text className="text-text-primary text-sm font-semibold w-8 text-right">
                {cat.count}
              </Text>
              {/* Chevron — always reserve space for alignment */}
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={hasL2 ? '#606060' : 'transparent'}
              />
            </TouchableOpacity>

            {/* L2 rows */}
            {isExpanded &&
              cat.l2.map((sub) => (
                <L2Row
                  key={sub.name}
                  name={sub.name}
                  count={sub.count}
                  maxCount={l2Max}
                  color={color}
                  progress={progress}
                  containerWidth={containerWidth}
                />
              ))}
          </View>
        );
      })}
    </View>
  );
}
