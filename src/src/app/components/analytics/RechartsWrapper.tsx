import { memo, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface BarChartWrapperProps {
  data: any[];
  bars: Array<{ dataKey: string; fill: string; name: string; stackId?: string }>;
  layout?: "horizontal" | "vertical";
  chartId: string;
}

export const BarChartWrapper = memo(function BarChartWrapper({
  data,
  bars,
  layout = "horizontal",
  chartId,
}: BarChartWrapperProps) {
  // Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  return (
    <div key={`container-${chartId}`} style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height={300} key={`responsive-${chartId}`}>
        <BarChart data={memoizedData} key={`chart-${chartId}`} layout={layout}>
          <CartesianGrid strokeDasharray="3 3" />
          {layout === "horizontal" ? (
            <>
              <XAxis dataKey="city" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={50} />
            </>
          ) : (
            <>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={50} />
            </>
          )}
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={`${chartId}-bar-${bar.dataKey}`}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              stackId={bar.stackId}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

interface ComposedChartWrapperProps {
  data: any[];
  bars?: Array<{ dataKey: string; fill: string; name: string }>;
  lines?: Array<{ dataKey: string; stroke: string; strokeWidth?: number; name: string }>;
  chartId: string;
}

export const ComposedChartWrapper = memo(function ComposedChartWrapper({
  data,
  bars = [],
  lines = [],
  chartId,
}: ComposedChartWrapperProps) {
  // Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  return (
    <div key={`container-${chartId}`} style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height={300} key={`responsive-${chartId}`}>
        <ComposedChart data={memoizedData} key={`chart-${chartId}`}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="city" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={`${chartId}-bar-${bar.dataKey}`}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              isAnimationActive={false}
            />
          ))}
          {lines.map((line) => (
            <Line
              key={`${chartId}-line-${line.dataKey}`}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth || 2}
              name={line.name}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

interface RadarChartWrapperProps {
  data: any[];
  dataKey: string;
  name: string;
  chartId: string;
}

export const RadarChartWrapper = memo(function RadarChartWrapper({
  data,
  dataKey,
  name,
  chartId,
}: RadarChartWrapperProps) {
  // Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  return (
    <div key={`container-${chartId}`} style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height={300} key={`responsive-${chartId}`}>
        <RadarChart data={memoizedData} key={`chart-${chartId}`}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name={name}
            dataKey={dataKey}
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});
