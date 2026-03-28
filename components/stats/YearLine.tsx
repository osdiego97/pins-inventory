import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated';
import { CumulativeStat } from '../../hooks/useStats';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHART_HEIGHT = 120;
const POINT_SPACING = 44;
const DOT_RADIUS = 3.5;
const LINE_COLOR = '#7ec8e8';
const ANIMATION_DURATION = 1000;
const PADDING_TOP = 20;

interface Props {
  data: CumulativeStat[];
}

export default function YearLine({ data }: Props) {
  const progress = useSharedValue(0);

  const { points, pathD, pathLength, svgWidth, svgHeight } = useMemo(() => {
    if (data.length === 0) return { points: [], pathD: '', pathLength: 1, svgWidth: 1, svgHeight: CHART_HEIGHT + PADDING_TOP };

    const maxTotal = Math.max(...data.map((d) => d.total));
    const w = Math.max((data.length - 1) * POINT_SPACING + DOT_RADIUS * 2, DOT_RADIUS * 2);
    const getX = (i: number) => i * POINT_SPACING + DOT_RADIUS;
    const getY = (total: number) => PADDING_TOP + CHART_HEIGHT - (total / maxTotal) * CHART_HEIGHT;

    const pts = data.map((d, i) => ({ x: getX(i), y: getY(d.total), count: d.total, year: d.year }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }

    return { points: pts, pathD: d, pathLength: len || 1, svgWidth: w, svgHeight: CHART_HEIGHT + PADDING_TOP };
  }, [data]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) });
  }, [data]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - progress.value),
  }));

  if (data.length === 0) {
    return (
      <View className="px-4">
        <Text className="text-text-muted text-sm">Sin datos de año</Text>
      </View>
    );
  }

  return (
    <View className="px-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Svg width={svgWidth} height={svgHeight}>
            <AnimatedPath
              d={pathD}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={pathLength}
              animatedProps={animatedProps}
            />
            {points.map((p) => (
              <Circle key={p.year} cx={p.x} cy={p.y} r={DOT_RADIUS} fill={LINE_COLOR} />
            ))}
          </Svg>

          {/* Count labels above dots */}
          <View style={{ position: 'absolute', top: 2, left: 0, right: 0 }}>
            {points.map((p) => (
              <Text
                key={p.year}
                className="text-text-secondary font-semibold absolute text-center"
                style={{ fontSize: 8, left: p.x - 12, width: 24 }}
              >
                {p.count}
              </Text>
            ))}
          </View>

          {/* Year labels */}
          <View style={{ width: svgWidth, height: 18, marginTop: 4 }}>
            {points.map((p) => (
              <Text
                key={p.year}
                className="text-text-muted absolute text-center"
                style={{ fontSize: 9, left: p.x - POINT_SPACING / 2, width: POINT_SPACING }}
              >
                {String(p.year).slice(2)}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
