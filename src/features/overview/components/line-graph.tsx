'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

type LineGraphPoint = {
  month: string;
  meta: number;
  faturamento: number;
};

type LineGraphProps = {
  title?: string;
  description?: string;
  data?: LineGraphPoint[];
  config?: ChartConfig;
  className?: string;
};

const defaultData: LineGraphPoint[] = [
  { month: 'Jan', meta: 120, faturamento: 98 },
  { month: 'Fev', meta: 120, faturamento: 110 },
  { month: 'Mar', meta: 120, faturamento: 105 },
  { month: 'Abr', meta: 120, faturamento: 130 },
  { month: 'Mai', meta: 120, faturamento: 118 },
  { month: 'Jun', meta: 120, faturamento: 142 }
];

const defaultConfig = {
  meta: {
    label: 'Meta',
    color: 'var(--primary)'
  },
  faturamento: {
    label: 'Faturamento',
    color: 'var(--muted-foreground)'
  }
} satisfies ChartConfig;

export function LineGraph({
  title = 'Meta vs Faturamento',
  description = 'Faturamento mes a mes',
  data = defaultData,
  config = defaultConfig,
  className
}: LineGraphProps) {
  return (
    <Card className={`@container/card ${className || ''}`.trim()}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer config={config} className='aspect-auto h-[260px] w-full'>
          <AreaChart
            data={data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillMeta' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-meta)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-meta)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillFaturamento' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-faturamento)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-faturamento)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent indicator='line' />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type='monotone'
              dataKey='meta'
              stroke='var(--color-meta)'
              fill='url(#fillMeta)'
              strokeWidth={2}
            />
            <Area
              type='monotone'
              dataKey='faturamento'
              stroke='var(--color-faturamento)'
              fill='url(#fillFaturamento)'
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
