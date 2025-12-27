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
import { ArrowUpCircle, ArrowDownCircle, Wallet, PieChart as PieChartIcon } from 'lucide-react';

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
  initialBalance: number; 
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

// Cores mais sofisticadas para Dark Mode
const COLORS = {
  income: '#34d399', // Emerald 400
  expense: '#fb7185', // Rose 400
  balance: '#60a5fa', // Blue 400
  pie: ['#60a5fa', '#a78bfa', '#f472b6', '#fb7185', '#fbbf24', '#34d399']
};

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(value);

const formatCurrencyFull = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- TOOLTIP COMPACTO (Estilo Vidro) ---
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl min-w-[180px]">
        <p className="text-zinc-500 text-[9px] font-bold mb-2 uppercase tracking-wider">{label}</p>
        
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            const val = entry.value ?? 0;
            // Ignora valores zerados para limpar o visual
            if (val === 0 && entry.dataKey !== 'balance') return null;

            return (
              <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  {entry.dataKey === 'income' && <ArrowUpCircle size={10} className="text-emerald-400" />}
                  {entry.dataKey === 'expense' && <ArrowDownCircle size={10} className="text-rose-400" />}
                  {entry.dataKey === 'balance' && <Wallet size={10} className="text-blue-400" />}
                  
                  <span className="text-zinc-300 capitalize font-medium">
                    {entry.name === 'income' ? 'Entrada' : entry.name === 'expense' ? 'Saída' : 'Saldo'}
                  </span>
                </div>
                <span className={`font-mono font-bold ${
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

export function FinancialCharts({ data, initialBalance }: FinancialChartsProps) {
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const limitDate = new Date(now);
  limitDate.setMonth(limitDate.getMonth() + 3); 
  limitDate.setDate(1);

  // Reducer (Logica de Agrupamento)
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

  // Cálculo de Saldo Acumulado
  const chartData = sortedChartData.reduce<{ results: GroupedData[], currentBalance: number }>((acc, item) => {
    const dailyResult = item.income - item.expense;
    const newBalance = acc.currentBalance + dailyResult;
    acc.results.push({ ...item, balance: newBalance });
    return { results: acc.results, currentBalance: newBalance };
  }, { results: [], currentBalance: initialBalance }).results;


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
      
      {/* 1. GRÁFICO PRINCIPAL */}
      <div className="xl:col-span-2 flex flex-col h-full min-h-[250px]">
        <div className="h-full w-full relative">
          <div className="absolute opacity-0">
             <svg>
               <defs>
                 <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={COLORS.balance} stopOpacity={0.2}/>
                   <stop offset="95%" stopColor={COLORS.balance} stopOpacity={0}/>
                 </linearGradient>
               </defs>
             </svg>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#ffffff" strokeOpacity={0.04} vertical={false} />
              
              <XAxis 
                dataKey="label" 
                stroke="#52525b" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                dy={10} 
                interval="preserveStartEnd"
                minTickGap={20}
              />
              
              <YAxis 
                stroke="#52525b" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value: number) => formatCurrency(value)} 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff', opacity: 0.02 }} />
              
              <Bar dataKey="income" name="income" fill={COLORS.income} barSize={4} radius={[2, 2, 2, 2]} fillOpacity={0.9} />
              <Bar dataKey="expense" name="expense" fill={COLORS.expense} barSize={4} radius={[2, 2, 2, 2]} fillOpacity={0.9} />

              <Area 
                type="monotone" 
                dataKey="balance" 
                name="balance" 
                stroke={COLORS.balance} 
                strokeWidth={2}
                fill="url(#balanceGradient)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.balance, stroke: '#fff' }}
              />

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. GRÁFICO SECUNDÁRIO (PIZZA) */}
      <Card className="bg-zinc-900/20 backdrop-blur-sm border-white/5 shadow-none rounded-2xl flex flex-col overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-4 border-b border-white/5">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <PieChartIcon size={12} />
                Gastos
            </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-center p-2">
          {pieChartData.length > 0 ? (
            <>
              <div className="flex-1 min-h-[120px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%" 
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={3}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                      itemStyle={{ color: '#fff', fontSize: '10px' }}
                      formatter={(value: number | undefined) => formatCurrencyFull(value ?? 0)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Total no centro */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <span className="text-[9px] text-zinc-500 block uppercase tracking-wide">Top 5</span>
                      <span className="text-[10px] font-bold text-white">
                        {formatCurrency(pieChartData.reduce((acc, curr) => acc + curr.value, 0))}
                      </span>
                   </div>
                </div>
              </div>
              
              <div className="space-y-1.5 px-2 pb-2">
                 {pieChartData.slice(0, 3).map((entry, index) => (
                   <div key={index} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.pie[index % COLORS.pie.length] }} />
                         <span className="text-zinc-400 font-medium truncate max-w-[80px]">{entry.name}</span>
                      </div>
                      <span className="font-mono text-zinc-300">{formatCurrency(entry.value)}</span>
                   </div>
                 ))}
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-1">
                <PieChartIcon size={20} className="opacity-20" />
                <p className="text-[10px]">Vazio</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}