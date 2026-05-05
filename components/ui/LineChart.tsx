import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/theme';
import { Text } from '@/components/ui/Text';

export interface LineChartData {
  date: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  title?: string;
  color?: string;
  unit?: string;
  width?: number;
  height?: number;
}

const { width: SCREEN_W } = Dimensions.get('window');

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = Colors.accent,
  unit = '',
  width = SCREEN_W - Spacing.lg * 2 - Spacing.md * 2, // Account for card padding
  height = 160,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text color="secondary">No data available for chart</Text>
      </View>
    );
  }

  // Handle single data point
  const chartData = data.length === 1 ? [data[0], data[0]] : data;

  const minVal = Math.min(...chartData.map((d) => d.value));
  const maxVal = Math.max(...chartData.map((d) => d.value));
  
  // Add some padding to min/max to avoid touching edges
  const yPadding = (maxVal - minVal) * 0.2 || 10;
  const graphMin = Math.max(0, minVal - yPadding);
  const graphMax = maxVal + yPadding;
  const range = graphMax - graphMin;

  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingHorizontal = 20;
  
  const graphWidth = width - paddingHorizontal * 2;
  const graphHeight = height - paddingTop - paddingBottom;

  const points = chartData.map((d, i) => {
    const x = paddingHorizontal + (i / (chartData.length - 1)) * graphWidth;
    const y = paddingTop + graphHeight - ((d.value - graphMin) / range) * graphHeight;
    return { x, y, value: d.value, date: d.date };
  });

  // Create path strings
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Determine x-axis labels (first, middle, last if many)
  const showLabels = chartData.length > 1;

  return (
    <View style={styles.container}>
      {title && (
        <Text semibold style={{ marginBottom: Spacing.sm }}>
          {title}
        </Text>
      )}
      
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Fill Area */}
        <Path d={areaPath} fill="url(#gradient)" />

        {/* Line */}
        <Path d={linePath} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

        {/* Data Points */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r={4} fill={Colors.bgCard} stroke={color} strokeWidth={2} />
            {/* Show value label on the highest point and latest point to avoid clutter, or all if few */}
            {(chartData.length <= 5 || i === points.length - 1 || p.value === maxVal) && (
              <SvgText
                x={p.x}
                y={p.y - 10}
                fill={Colors.textPrimary}
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {`${p.value}${unit}`}
              </SvgText>
            )}
          </React.Fragment>
        ))}

        {/* X-Axis Labels (Dates) */}
        {showLabels && (
          <>
            <SvgText x={points[0].x} y={height - 5} fill={Colors.textMuted} fontSize="10" textAnchor="start">
              {new Date(points[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </SvgText>
            <SvgText x={points[points.length - 1].x} y={height - 5} fill={Colors.textMuted} fontSize="10" textAnchor="end">
              {new Date(points[points.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
});
