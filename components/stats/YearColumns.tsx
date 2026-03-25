import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated';
import { YearStat } from '../../hooks/useStats';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const CHART_HEIGHT = 100;
const COL_WIDTH = 24;
const COL_GAP = 6;
const RADIUS = 3;
const BAR_COLOR = '#e8c97e';
const ANIMATION_DURATION = 900;

interface ColumnProps {
  count: number;
  maxCount: number;
  x: number;
  progress: Animated.SharedValue<number>;
}

function Column({ count, maxCount, x, progress }: ColumnProps) {
  const targetHeight = maxCount > 0 ? (count / maxCount) * CHART_HEIGHT : 0;

  const animatedProps = useAnimatedProps(() => {
    const h = targetHeight * progress.value;
    return {
      height: h,
      y: CHART_HEIGHT - h,
    };
  });

  return (
    <AnimatedRect
      x={x}
      width={COL_WIDTH}
      fill={BAR_COLOR}
      rx={RADIUS}
      ry={RADIUS}
      animatedProps={animatedProps}
    />
  );
}

interface Props {
  years: YearStat[];
  pinsWithoutYear: number;
}

export default function YearColumns({ years, pinsWithoutYear }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  if (years.length === 0) {
    return (
      <View className="px-4">
        <Text className="text-text-muted text-sm">Sin datos de año</Text>
      </View>
    );
  }

  const maxCount = Math.max(...years.map((y) => y.count));
  const svgWidth = years.length * (COL_WIDTH + COL_GAP) - COL_GAP;

  return (
    <View className="px-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Count labels above bars */}
          <View className="flex-row mb-1">
            {years.map((y, i) => (
              <View
                key={y.year}
                style={{ width: COL_WIDTH, marginRight: i < years.length - 1 ? COL_GAP : 0 }}
              >
                <Text
                  className="text-accent text-center font-semibold"
                  style={{ fontSize: 8 }}
                  numberOfLines={1}
                >
                  {y.count}
                </Text>
              </View>
            ))}
          </View>

          {/* Columns */}
          <Svg width={svgWidth} height={CHART_HEIGHT}>
            {years.map((y, i) => (
              <Column
                key={y.year}
                count={y.count}
                maxCount={maxCount}
                x={i * (COL_WIDTH + COL_GAP)}
                progress={progress}
              />
            ))}
          </Svg>

          {/* Year labels */}
          <View className="flex-row mt-2">
            {years.map((y, i) => (
              <View
                key={y.year}
                style={{ width: COL_WIDTH, marginRight: i < years.length - 1 ? COL_GAP : 0 }}
              >
                <Text
                  className="text-text-muted text-center"
                  style={{ fontSize: 9 }}
                  numberOfLines={1}
                >
                  {String(y.year).slice(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {pinsWithoutYear > 0 && (
        <Text className="text-text-muted text-xs mt-3">
          {pinsWithoutYear} {pinsWithoutYear === 1 ? 'pin sin año' : 'pins sin año'}
        </Text>
      )}
    </View>
  );
}
