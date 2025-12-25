'use client'

import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell, 
  Area,
  TooltipProps
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

// Componentes Shadcn UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// --- INTERFACES ---

export interface ChartData {
  amount: number;
  date: string;
  type: string;
  categoryName?: string;
}

interface FinancialChartsProps {
  data: ChartData[];
}

interface GroupedData {
  label: string;
  sortDate: number;
  income: number;
  expense: number;
  balance?: number;
}

interface CustomTooltipPayload {
  value?: number;
  name?: string;
  dataKey?: string;
  color?: string;
  payload?: GroupedData; 
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  payload?: CustomTooltipPayload[];
  label?: string;
}

// Cores Profissionais (Mantendo as mesmas para consistência)
const COLORS = {
  income: '#10b981', // Emerald 500
  expense: '#f43f5e', // Rose 500
  balance: '#3b82f6', // Blue 500
  pie: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981']
};

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(value);

const formatCurrencyFull = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- COMPONENTE: CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px]">
        <p className="text-zinc-400 text-xs font-medium mb-3 uppercase tracking-wider">{label}</p>
        
        <div className="space-y-3">
          {payload.map((entry, index) => {
            const val = entry.value ?? 0;

            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {entry.dataKey === 'income' && <ArrowUpCircle size={14} className="text-emerald-500" />}
                  {entry.dataKey === 'expense' && <ArrowDownCircle size={14} className="text-rose-500" />}
                  {entry.dataKey === 'balance' && <Wallet size={14} className="text-blue-500" />}
                  
                  <span className="text-sm text-zinc-200 capitalize">
                    {entry.name === 'income' ? 'Entradas' : entry.name === 'expense' ? 'Saídas' : 'Saldo'}
                  </span>
                </div>
                <span className={`text-sm font-bold font-mono ${
                   entry.dataKey === 'income' ? 'text-emerald-400' : 
                   entry.dataKey === 'expense' ? 'text-rose-400' : 'text-blue-400'
                }`}>
                  {formatCurrencyFull(val)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function FinancialCharts({ data }: FinancialChartsProps) {
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const limitDate = new Date(now);
  limitDate.setMonth(limitDate.getMonth() + 3); 
  limitDate.setDate(1);

  // Reducer
  const groupedMap = data.reduce<Record<string, GroupedData>>((acc, t) => {
    const tDate = new Date(t.date);
    
    // Filtro de Limite Futuro
    const tCheck = new Date(tDate.getFullYear(), tDate.getMonth(), 1);
    const limitCheck = new Date(limitDate.getFullYear(), limitDate.getMonth(), 1);
    
    if (tCheck > limitCheck) return acc;

    const isCurrentOrPast = 
      tDate < now || 
      (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear);

    let key: string;
    let sortDate: number;

    if (isCurrentOrPast) {
      key = tDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dateKey = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
      sortDate = dateKey.getTime();
    } else {
      const monthLabel = tDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const yearLabel = tDate.getFullYear().toString().slice(-2);
      key = `${monthLabel}/${yearLabel}`;
      const monthKey = new Date(tDate.getFullYear(), tDate.getMonth(), 1);
      sortDate = monthKey.getTime();
    }
    
    if (!acc[key]) {
      acc[key] = { label: key, sortDate: sortDate, income: 0, expense: 0 };
    }

    if (t.type === 'INCOME') acc[key].income += t.amount;
    else acc[key].expense += t.amount;

    return acc;
  }, {});

  const sortedChartData = Object.values(groupedMap).sort((a, b) => a.sortDate - b.sortDate);

  // Cálculo de Saldo
  const chartData = sortedChartData.reduce<{ results: GroupedData[], currentBalance: number }>((acc, item) => {
    const dailyResult = item.income - item.expense;
    const newBalance = acc.currentBalance + dailyResult;
    acc.results.push({ ...item, balance: newBalance });
    return { results: acc.results, currentBalance: newBalance };
  }, { results: [], currentBalance: 0 }).results;


  // --- DADOS PIZZA ---
  const pieChartDataRaw = data
    .filter(t => t.type === 'EXPENSE' && t.categoryName)
    .reduce((acc: Record<string, number>, t) => {
      const catName = t.categoryName || 'Outros';
      acc[catName] = (acc[catName] || 0) + t.amount;
      return acc;
    }, {});

  const pieChartData = Object.entries(pieChartDataRaw)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) 
    .slice(0, 5); 

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
      
      {/* 1. GRÁFICO PRINCIPAL (CARD) */}
      <Card className="xl:col-span-2 bg-zinc-900/60 backdrop-blur-md border-white/5 shadow-xl">
        <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="text-primary" size={20} />
                Fluxo de Caixa
            </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full relative pl-0">
          <div className="absolute opacity-0">
             <svg>
               <defs>
                 <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={COLORS.balance} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={COLORS.balance} stopOpacity={0}/>
                 </linearGradient>
               </defs>
             </svg>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
              
              <XAxis 
                dataKey="label" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10} 
                interval="preserveStartEnd"
              />
              
              <YAxis 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value: number) => formatCurrency(value)} 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff', opacity: 0.02 }} />
              
              <Bar dataKey="income" name="income" fill={COLORS.income} barSize={6} radius={[4, 4, 4, 4]} fillOpacity={1} />
              <Bar dataKey="expense" name="expense" fill={COLORS.expense} barSize={6} radius={[4, 4, 4, 4]} fillOpacity={1} />

              <Area 
                type="monotone" 
                dataKey="balance" 
                name="balance" 
                stroke={COLORS.balance} 
                strokeWidth={3}
                fill="url(#balanceGradient)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.balance, stroke: '#fff' }}
              />

            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. GRÁFICO SECUNDÁRIO (CARD) */}
      <Card className="bg-zinc-900/60 backdrop-blur-md border-white/5 shadow-xl flex flex-col">
        <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <PieChartIcon className="text-primary" size={20} />
                Categorias
            </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col relative min-h-[300px]">
          {pieChartData.length > 0 ? (
            <>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={5}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                       border: '1px solid rgba(255,255,255,0.1)', 
                       borderRadius: '12px'
                     }}
                     itemStyle={{ color: '#fff', fontSize: '12px' }}
                     formatter={(value: number | undefined) => formatCurrencyFull(value ?? 0)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full px-2 mt-4 space-y-3">
                 {pieChartData.slice(0, 3).map((entry, index) => (
                   <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.pie[index % COLORS.pie.length] }} />
                         <span className="text-zinc-300 font-medium">{entry.name}</span>
                      </div>
                      <span className="font-mono text-zinc-500">{formatCurrency(entry.value)}</span>
                   </div>
                 ))}
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-zinc-600 flex-1">
                <div className="p-4 bg-zinc-900/50 rounded-full mb-3 border border-white/5">
                   <Wallet size={24} className="opacity-20" />
                </div>
                <p className="text-sm">Sem dados suficientes</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}