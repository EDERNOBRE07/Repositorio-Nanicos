import React, { useState, useEffect, useMemo } from "react";
import { ElectoralDeadline } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertCircle, Clock, Calendar, ArrowRight } from "lucide-react";

interface UrgentDeadlinesWidgetProps {
  deadlines: ElectoralDeadline[];
  onViewAll: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

export default function UrgentDeadlinesWidget({ deadlines, onViewAll }: UrgentDeadlinesWidgetProps) {
  const [now, setNow] = useState<Date>(new Date());

  // Update current time every second for a live ticking countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate live countdown for a given ISO date YYYY-MM-DD
  const calculateTimeRemaining = (dateStr: string): TimeRemaining => {
    // Electoral deadlines usually expire at 23:59:59 on the target date (local Brazil time)
    const target = new Date(`${dateStr}T23:59:59`);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    return { days, hours, minutes, seconds, totalMs: diffMs, expired: false };
  };

  // Get the 3 closest pending (non-completed) deadlines
  const urgentDeadlines = useMemo(() => {
    return deadlines
      .filter(d => d.status !== "Concluído")
      .map(d => {
        const timeRem = calculateTimeRemaining(d.date);
        return {
          ...d,
          timeRem,
          // Calculate active days remaining dynamically
          currentDaysRemaining: timeRem.expired ? 0 : Math.max(0, Math.ceil(timeRem.totalMs / (1000 * 60 * 60 * 24)))
        };
      })
      // Sort by soonest to expire
      .sort((a, b) => a.timeRem.totalMs - b.timeRem.totalMs)
      .slice(0, 3);
  }, [deadlines, now.getDate()]); // re-evaluate daily or if list changes

  // Prepare chart data for Recharts
  const chartData = useMemo(() => {
    // Reverse array to render the soonest deadline at the top of the horizontal BarChart
    return [...urgentDeadlines].reverse().map(d => {
      // Safely calculate remaining days for the bar
      const timeRem = calculateTimeRemaining(d.date);
      const days = timeRem.expired ? 0 : Math.max(0, Math.ceil(timeRem.totalMs / (1000 * 60 * 60 * 24)));
      
      return {
        id: d.id,
        // Truncate name for Y-axis label
        shortName: d.title.length > 22 ? d.title.substring(0, 22) + "..." : d.title,
        title: d.title,
        days: days,
        status: d.status,
        category: d.category
      };
    });
  }, [urgentDeadlines]);

  if (urgentDeadlines.length === 0) {
    return (
      <div className="bg-white p-6 rounded-none border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center py-8">
        <Clock className="mx-auto text-emerald-500 mb-2.5 animate-pulse" size={32} />
        <h4 className="text-sm font-black text-gray-800 uppercase">Tudo Sob Controle</h4>
        <p className="text-xs text-gray-500 mt-1">
          Não há prazos eleitorais urgentes ou pendentes cadastrados no momento.
        </p>
      </div>
    );
  }

  // Determine colors based on days left
  const getBarColor = (days: number, status: string) => {
    if (status === "Crítico" || days <= 15) return "#E6007E"; // Urgência máxima (Magenta Cidadania)
    if (days <= 30) return "#FFD700"; // Atenção média (Dourado PSDB/Federação)
    return "#004488"; // Normal (Azul PSDB)
  };

  return (
    <div className="bg-white rounded-none border-2 border-[#1A1A1B] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 grid grid-cols-1 lg:grid-cols-12 gap-6" id="urgent-deadlines-summary-widget">
      
      {/* Visual Bar Chart Section (Lg: 5 columns) */}
      <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-gray-100 pb-5 lg:pb-0 lg:pr-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">
              Análise de Proximidade (Dias)
            </h4>
          </div>
          <p className="text-[11px] text-gray-500 mb-4">
            Proporção de tempo restante até a data de encerramento de cada obrigação legal.
          </p>
        </div>

        {/* Recharts BarChart container */}
        <div className="h-44 w-full pr-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={[0, 'dataMax + 10']}
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#1A1A1B' }}
                axisLine={{ stroke: '#1A1A1B', strokeWidth: 1.5 }}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="shortName" 
                width={120}
                tick={{ fontSize: 9, fontWeight: 'bold', fill: '#1A1A1B' }}
                axisLine={{ stroke: '#1A1A1B', strokeWidth: 1.5 }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2.5 border-2 border-[#1A1A1B] shadow-xs text-xs">
                        <p className="font-black text-[#1A1A1B]">{data.title}</p>
                        <p className="text-gray-500 mt-0.5 font-bold uppercase text-[10px]">
                          Categoria: <span className="text-[#004488]">{data.category}</span>
                        </p>
                        <p className="text-gray-900 mt-1 font-extrabold font-mono">
                          Dias Restantes: {data.days}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.id}`} 
                    fill={getBarColor(entry.days, entry.status)}
                    stroke="#1A1A1B"
                    strokeWidth={1.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[10px] font-black uppercase text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#E6007E] border border-[#1A1A1B] inline-block"></span>
            <span>Crítico (&lt;15d)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#FFD700] border border-[#1A1A1B] inline-block"></span>
            <span>Atenção (&lt;30d)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#004488] border border-[#1A1A1B] inline-block"></span>
            <span>Seguro (30d+)</span>
          </div>
        </div>
      </div>

      {/* Countdown and Details Section (Lg: 7 columns) */}
      <div className="lg:col-span-7 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-amber-500 animate-bounce" size={18} />
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              3 Próximos Prazos Eleitorais Mais Urgentes
            </h3>
          </div>
          <button 
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-black text-[#004488] hover:text-[#002244] uppercase transition group cursor-pointer"
          >
            Ver Todos
            <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Grid of countdowns */}
        <div className="space-y-3.5">
          {urgentDeadlines.map((dl) => {
            const timeRem = calculateTimeRemaining(dl.date);
            const isCritical = dl.status === "Crítico" || timeRem.days <= 15;

            return (
              <div 
                key={dl.id}
                className={`p-3.5 rounded-none border-2 border-[#1A1A1B] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition ${
                  isCritical 
                    ? "bg-rose-50/20 shadow-[3px_3px_0px_0px_rgba(230,0,126,0.15)] hover:bg-rose-50/45" 
                    : "bg-amber-50/5 hover:bg-slate-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                {/* Details info */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-none border border-[#1A1A1B] ${
                      dl.category === "Convenção" ? "bg-indigo-50 text-indigo-700" :
                      dl.category === "Registro" ? "bg-amber-50 text-amber-700" :
                      dl.category === "Prestação de Contas" ? "bg-sky-50 text-sky-700" :
                      "bg-purple-50 text-purple-700"
                    }`}>
                      {dl.category}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono font-bold">
                      {dl.date.split("-").reverse().join("/")}
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-gray-900 truncate" title={dl.title}>
                    {dl.title}
                  </h5>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5" title={dl.description}>
                    {dl.description}
                  </p>
                </div>

                {/* Countdown visual boxes */}
                <div className="flex items-center gap-1.5 self-end md:self-auto flex-shrink-0">
                  {timeRem.expired ? (
                    <span className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-none border border-red-200 bg-red-50 text-red-600 uppercase">
                      Expirado / Limite Atingido
                    </span>
                  ) : (
                    <>
                      {/* Days box */}
                      <div className="flex flex-col items-center">
                        <div className="px-2 py-1 bg-[#1A1A1B] text-white font-mono text-xs font-black min-w-[32px] text-center rounded-none border border-[#1A1A1B]">
                          {String(timeRem.days).padStart(2, "0")}
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">dias</span>
                      </div>
                      <span className="font-bold text-[#1A1A1B] -mt-2.5 font-mono">:</span>
                      {/* Hours box */}
                      <div className="flex flex-col items-center">
                        <div className="px-2 py-1 bg-[#1A1A1B] text-white font-mono text-xs font-black min-w-[32px] text-center rounded-none border border-[#1A1A1B]">
                          {String(timeRem.hours).padStart(2, "0")}
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">horas</span>
                      </div>
                      <span className="font-bold text-[#1A1A1B] -mt-2.5 font-mono">:</span>
                      {/* Minutes box */}
                      <div className="flex flex-col items-center">
                        <div className="px-2 py-1 bg-white text-gray-900 border-2 border-[#1A1A1B] font-mono text-xs font-black min-w-[32px] text-center rounded-none">
                          {String(timeRem.minutes).padStart(2, "0")}
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">min</span>
                      </div>
                      <span className="font-bold text-[#1A1A1B] -mt-2.5 font-mono">:</span>
                      {/* Seconds box */}
                      <div className="flex flex-col items-center">
                        <div className={`px-2 py-1 border-2 border-[#1A1A1B] font-mono text-xs font-black min-w-[32px] text-center rounded-none ${
                          isCritical ? "bg-[#E6007E] text-white" : "bg-[#FFD700] text-gray-900"
                        }`}>
                          {String(timeRem.seconds).padStart(2, "0")}
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">seg</span>
                      </div>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
