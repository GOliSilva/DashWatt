'use client';

import PageContainer from '@/components/layout/page-container';
import { ChartConfig } from '@/components/ui/chart';
import { PieGraph } from '@/features/overview/components/pie-graph';
import { LineGraph } from '@/features/overview/components/line-graph';

const lineTones = {
  meta: 'rgb(16 185 129)',
  faturamento: 'rgb(59 130 246)'
};

const sectorTone = 'var(--primary)';

type PieChartDefinition = {
  title: string;
  caption: string;
  config: ChartConfig;
  data: { name: string; value: number }[];
  centerLabel: string;
};

const pieCharts: PieChartDefinition[] = [
  {
    title: 'Automacao',
    caption: 'Faturamento por setor',
    config: {
      domotica: { label: 'Domotica', color: sectorTone },
      industrial: { label: 'Industrial', color: sectorTone },
      residencial: { label: 'Residencial', color: sectorTone }
    },
    data: [
      { name: 'domotica', value: 42 },
      { name: 'industrial', value: 33 },
      { name: 'residencial', value: 25 }
    ],
    centerLabel: 'Faturamento'
  },
  {
    title: 'Eletrica',
    caption: 'Participacao por setor',
    config: {
      comercial: { label: 'Comercial', color: sectorTone },
      infraestrutura: { label: 'Infraestrutura', color: sectorTone },
      manutencao: { label: 'Manutencao', color: sectorTone }
    },
    data: [
      { name: 'comercial', value: 38 },
      { name: 'infraestrutura', value: 29 },
      { name: 'manutencao', value: 33 }
    ],
    centerLabel: 'Setores'
  },
  {
    title: 'Geral',
    caption: 'Automacao vs Eletrica',
    config: {
      automacao: { label: 'Automacao', color: sectorTone },
      eletrica: { label: 'Eletrica', color: sectorTone }
    },
    data: [
      { name: 'automacao', value: 54 },
      { name: 'eletrica', value: 46 }
    ],
    centerLabel: 'Total'
  }
];

const goalConfig = {
  meta: {
    label: 'Meta',
    color: lineTones.meta
  },
  faturamento: {
    label: 'Faturamento',
    color: lineTones.faturamento
  }
};

const goalData = [
  { month: 'Jan', meta: 120, faturamento: 98 },
  { month: 'Fev', meta: 120, faturamento: 110 },
  { month: 'Mar', meta: 120, faturamento: 105 },
  { month: 'Abr', meta: 120, faturamento: 130 },
  { month: 'Mai', meta: 120, faturamento: 118 },
  { month: 'Jun', meta: 120, faturamento: 142 }
];

export default function EstatisticasPage() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-3'>
          {pieCharts.map((chart) => (
            <PieGraph
              key={chart.title}
              title={chart.title}
              description={chart.caption}
              shortDescription={chart.caption}
              data={chart.data}
              config={chart.config}
              centerLabel={chart.centerLabel}
              className='[&_[data-slot=card-content]]:pt-0 [&_[data-slot=card-content]]:sm:pt-0 [&_[data-slot=chart]]:h-[230px]'
            />
          ))}
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs'>
          <LineGraph
            data={goalData}
            config={goalConfig}
            className='[&_[data-slot=chart]]:h-[220px]'
          />
        </div>
      </div>
    </PageContainer>
  );
}
