'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';

const chartData = [
  { month: 'January', requests: 186 },
  { month: 'February', requests: 305 },
  { month: 'March', requests: 237 },
  { month: 'April', requests: 173 },
  { month: 'May', requests: 209 },
  { month: 'June', requests: 214 },
  { month: 'July', requests: 280 },
];

const chartConfig = {
  requests: {
    label: 'Requests',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function RequestsChart() {
  return (
    <Card className="fade-in transition-all hover:shadow-lg h-full">
      <CardHeader>
        <CardTitle>Document Requests Overview</CardTitle>
        <CardDescription>Monthly document requests - 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
