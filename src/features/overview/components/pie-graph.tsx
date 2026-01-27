'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

type PieDatum = {
  name: string;
  value: number;
};

type PieGraphProps = {
  title?: string;
  description?: string;
  shortDescription?: string;
  data?: PieDatum[];
  config?: ChartConfig;
  centerLabel?: string;
  centerValue?: number | string;
  className?: string;
  contentClassName?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
};

const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.', ',') + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace('.', ',') + 'k';
  }
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const defaultData: PieDatum[] = [
  { name: 'chrome', value: 275 },
  { name: 'safari', value: 200 },
  { name: 'firefox', value: 287 },
  { name: 'edge', value: 173 },
  { name: 'other', value: 190 }
];

const defaultConfig = {
  chrome: {
    label: 'Chrome',
    color: 'var(--primary)'
  },
  safari: {
    label: 'Safari',
    color: 'var(--primary)'
  },
  firefox: {
    label: 'Firefox',
    color: 'var(--primary)'
  },
  edge: {
    label: 'Edge',
    color: 'var(--primary)'
  },
  other: {
    label: 'Other',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function PieGraph({
  title = 'Pie Chart - Donut with Text',
  description = 'Total visitors by browser for the last 6 months',
  shortDescription,
  data = defaultData,
  config = defaultConfig,
  centerLabel = 'Total Visitors',
  centerValue,
  className,
  contentClassName,
  innerRadius = 60,
  outerRadius
}: PieGraphProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const displayValue =
    typeof centerValue === 'number'
      ? formatCompactNumber(centerValue)
      : centerValue ?? formatCompactNumber(totalValue);

  return (
    <Card className={`@container/card ${className || ''}`.trim()}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>{description}</span>
          <span className='@[540px]/card:hidden'>
            {shortDescription || description}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className={contentClassName ?? 'px-2 pt-4 sm:px-6 sm:pt-6'}>
        <ChartContainer config={config} className='mx-auto aspect-square h-[250px]'>
          <PieChart>
            <defs>
              {data.map((item, index) => (
                <linearGradient
                  key={item.name}
                  id={`fill${item.name}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor={`var(--color-${item.name})`}
                    stopOpacity={1 - index * 0.1}
                  />
                  <stop
                    offset='100%'
                    stopColor={`var(--color-${item.name})`}
                    stopOpacity={0.6 - index * 0.08}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey='name' />}
            />
            <Pie
              data={data.map((item) => ({
                ...item,
                fill: `url(#fill${item.name})`
              }))}
              dataKey='value'
              nameKey='name'
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {displayValue}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          {centerLabel}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          {shortDescription || description} <IconTrendingUp className='h-4 w-4' />
        </div>
        <div className='text-muted-foreground leading-none'>
          Baseado nos dados mais recentes
        </div>
      </CardFooter>
    </Card>
  );
}
