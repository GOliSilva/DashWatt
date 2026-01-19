'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const materials = [
  {
    id: 'mat-1',
    name: 'Cabo flexivel 2,5mm',
    category: 'Eletrica',
    unitCost: 4.5,
    stock: 120
  },
  {
    id: 'mat-2',
    name: 'Disjuntor 20A',
    category: 'Eletrica',
    unitCost: 38,
    stock: 22
  },
  {
    id: 'mat-3',
    name: 'Sensor de presenca',
    category: 'Automacao',
    unitCost: 95,
    stock: 14
  },
  {
    id: 'mat-4',
    name: 'Eletrocalha 50cm',
    category: 'Infraestrutura',
    unitCost: 28.4,
    stock: 40
  }
];

const costs = [
  {
    id: 'cost-1',
    type: 'Transporte',
    description: 'Frete do fornecedor',
    amount: 780,
    quantity: 1,
    isExpense: true
  },
  {
    id: 'cost-2',
    type: 'Material',
    description: 'Cabo flexivel 2,5mm',
    amount: 540,
    quantity: 120,
    isExpense: true
  },
  {
    id: 'cost-3',
    type: 'Alimentacao',
    description: 'Equipe em campo',
    amount: 220,
    quantity: 5,
    isExpense: true
  },
  {
    id: 'cost-4',
    type: 'Outros',
    description: 'Servico adicional',
    amount: 1250,
    quantity: 1,
    isExpense: false
  }
];

const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

const costTypeOptions = ['Transporte', 'Alimentacao', 'Outros', 'Material'];

const typeBadgeStyles: Record<string, string> = {
  Transporte: 'bg-blue-500/10 text-blue-700',
  Alimentacao: 'bg-amber-500/10 text-amber-700',
  Outros: 'bg-slate-500/10 text-slate-700',
  Material: 'bg-emerald-500/10 text-emerald-700'
};

export default function PrecificacaoPage() {
  const [costType, setCostType] = React.useState('Transporte');
  const [isExpense, setIsExpense] = React.useState(true);

  const totals = React.useMemo(() => {
    return costs.reduce(
      (acc, cost) => {
        if (cost.isExpense) {
          acc.expenses += cost.amount;
        } else {
          acc.revenue += cost.amount;
        }
        return acc;
      },
      { expenses: 0, revenue: 0 }
    );
  }, []);

  return (
    <PageContainer
      pageTitle='Precificacao'
      pageDescription='Custos, materiais e margem'
    >
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-12'>
          <Card className='h-full lg:col-span-5'>
            <CardHeader>
              <CardTitle>Custos</CardTitle>
              <CardDescription>Adicionar novos custos</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='space-y-1'>
                <label className='text-sm font-medium' htmlFor='costType'>
                  Tipo
                </label>
                <Select value={costType} onValueChange={setCostType}>
                  <SelectTrigger id='costType'>
                    <SelectValue placeholder='Selecione o tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    {costTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {costType === 'Material' ? (
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='materialName'>
                    Material
                  </label>
                  <Select>
                    <SelectTrigger id='materialName'>
                      <SelectValue placeholder='Selecione o material' />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.name}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className='space-y-1'>
                <label className='text-sm font-medium' htmlFor='costDescription'>
                  Descricao
                </label>
                <Textarea
                  id='costDescription'
                  placeholder='Detalhe do custo'
                  className='min-h-16'
                />
              </div>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='costAmount'>
                    Preco
                  </label>
                  <Input
                    id='costAmount'
                    type='number'
                    min='0'
                    step='0.01'
                    placeholder='0.00'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='costQuantity'>
                    Quantidade
                  </label>
                  <Input
                    id='costQuantity'
                    type='number'
                    min='1'
                    step='1'
                    placeholder='1'
                  />
                </div>
              </div>
              <div className='flex items-center justify-between rounded-md border p-3'>
                <div className='text-sm font-medium'>Tipo de lancamento</div>
                <div className='flex items-center gap-2 text-xs'>
                  <span
                    className={isExpense ? 'text-foreground' : 'text-muted-foreground'}
                  >
                    Despesa
                  </span>
                  <Switch
                    checked={isExpense}
                    onCheckedChange={setIsExpense}
                    aria-label='Alternar entre despesa e lucro'
                  />
                  <span
                    className={!isExpense ? 'text-foreground' : 'text-muted-foreground'}
                  >
                    Lucro
                  </span>
                </div>
              </div>
              <Button type='button' className='w-full'>
                Adicionar custo
              </Button>
            </CardContent>
          </Card>

          <Card className='h-full lg:col-span-7'>
            <CardHeader>
              <CardTitle>Custos registrados</CardTitle>
              <CardDescription>Faturamento e despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>
                    Faturamento
                  </div>
                  <div className='mt-1 text-lg font-semibold'>
                    {formatCurrency(totals.revenue)}
                  </div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>Despesas</div>
                  <div className='mt-1 text-lg font-semibold'>
                    {formatCurrency(totals.expenses)}
                  </div>
                </div>
              </div>
              <ScrollArea className='mt-3 h-64 pr-3'>
                <div className='space-y-2'>
                  {costs.map((cost) => (
                    <div
                      key={cost.id}
                      className='flex items-start justify-between gap-3 rounded-md border p-3'
                    >
                      <div className='flex flex-col'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge className={typeBadgeStyles[cost.type]}>
                            {cost.type}
                          </Badge>
                          <Badge variant='outline'>
                            {cost.isExpense ? 'Despesa' : 'Lucro'}
                          </Badge>
                        </div>
                        <span className='mt-2 text-sm font-medium'>
                          {cost.description}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          Quantidade: {cost.quantity}
                        </span>
                      </div>
                      <div className='text-sm font-semibold'>
                        {formatCurrency(cost.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className='h-full lg:col-span-12'>
            <CardHeader>
              <CardTitle>Materiais</CardTitle>
              <CardDescription>Lista de materiais</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-64 pr-3'>
                <div className='space-y-2'>
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className='flex items-start justify-between gap-3 rounded-md border p-3'
                    >
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          {material.name}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          Setor: {material.category}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          Estoque: {material.stock}
                        </span>
                      </div>
                      <div className='text-sm font-semibold'>
                        {formatCurrency(material.unitCost)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
