import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

import { SEGMENT_COLORS } from '../../constants/chartColors';
import { useThemeColors } from '../../contexts/ThemeContext';

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 82;
const STROKE_WIDTH = 22;
const GAP = 4; // circumference pixels between segments
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ANIMATION_DURATION = 900;

interface Segment {
  name: string;
  count: number;
  startFraction: number;
  sweepFraction: number;
  color: string;
}

interface AnimatedSegmentProps {
  startFraction: number;
  sweepFraction: number;
  color: string;
  progress: Animated.SharedValue<number>;
}

function AnimatedSegment({ startFraction, sweepFraction, color, progress }: AnimatedSegmentProps) {
  const dashOffset = CIRCUMFERENCE * (0.75 - startFraction);

  const animatedProps = useAnimatedProps(() => {
    const len = Math.max(0, sweepFraction * CIRCUMFERENCE * progress.value - GAP);
    return {
      strokeDasharray: [len, CIRCUMFERENCE - len],
    };
  });

  return (
    <AnimatedCircle
      cx={CX}
      cy={CY}
      r={RADIUS}
      fill="transparent"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="butt"
      strokeDashoffset={dashOffset}
      animatedProps={animatedProps}
    />
  );
}

interface Props {
  categories: { name: string; count: number }[];
  uncategorized: number;
  totalPins: number;
}

export default function DonutChart({ categories, uncategorized, totalPins }: Props) {
  const colors = useThemeColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const allSegments = [
    ...categories,
    ...(uncategorized > 0 ? [{ name: 'Sin categoría', count: uncategorized }] : []),
  ];
  const total = allSegments.reduce((sum, s) => sum + s.count, 0);

  let accumulated = 0;
  const segments: Segment[] = allSegments.map((s, i) => {
    const sweepFraction = total > 0 ? s.count / total : 0;
    const seg: Segment = {
      name: s.name,
      count: s.count,
      startFraction: accumulated,
      sweepFraction,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    };
    accumulated += sweepFraction;
    return seg;
  });

  return (
    <View className="items-center">
      <View style={{ width: SIZE, height: SIZE }}>
        {/* Background ring */}
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
          <Circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="transparent"
            stroke={colors.border}
            strokeWidth={STROKE_WIDTH}
          />
        </Svg>

        {/* Animated segments */}
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
          <G>
            {segments.map((seg) => (
              <AnimatedSegment
                key={seg.name}
                startFraction={seg.startFraction}
                sweepFraction={seg.sweepFraction}
                color={seg.color}
                progress={progress}
              />
            ))}
          </G>
        </Svg>

        {/* Center text */}
        <View
          style={{
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-text-primary text-4xl font-bold">{totalPins}</Text>
          <Text className="text-text-muted text-xs uppercase tracking-widest mt-1">pins</Text>
        </View>
      </View>

      {/* Color legend — two columns */}
      <View className="flex-row flex-wrap justify-center mt-4 px-4 gap-y-2">
        {segments.map((seg) => (
          <View key={seg.name} className="flex-row items-center mr-4">
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: seg.color,
                marginRight: 5,
              }}
            />
            <Text className="text-text-secondary text-xs">{seg.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
