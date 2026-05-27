/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Scale,
  Printer,
  Search,
  Plus,
  Trash2,
  FileCheck,
  Building,
  ArrowUpDown,
  History,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidacionData, Debedor } from '../types';

interface DeudoresPanelProps {
  liquidaciones: LiquidacionData[];
  activeLiq: LiquidacionData | null;
  onUpdateDeudores?: (liqId: string, updatedDeudores: Debedor[]) => void;
}

export default function DeudoresPanel({
  liquidaciones,
  activeLiq,
  onUpdateDeudores
}: DeudoresPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // New debtor form states
  const [newUnidad, setNewUnidad] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newDeuda, setNewDeuda] = useState('');
  const [newMeses, setNewMeses] = useState('');
  const [newInteres, setNewInteres] = useState('');
  const [newEstado, setNewEstado] = useState<'grave' | 'alerta' | 'leve' | 'judicial'>('leve');

  // Multi-period sorting
  const sortedLiqs = [...liquidaciones].sort((a, b) => {
    // Basic date parsing assumption "Abril 2026" / "Mayo 2026"
    const months: Record<string, number> = {
      enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
      julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
    };
    const parsePeriod = (p: string) => {
      const parts = p.toLowerCase().split(' ');
      const m = months[parts[0]] || 0;
      const y = parseInt(parts[1]) || 0;
      return y * 12 + m;
    };
    return parsePeriod(a.periodo) - parsePeriod(b.periodo);
  });

  // Current liquidations and selection fallback
  const currentLiq = activeLiq || sortedLiqs[sortedLiqs.length - 1] || null;
  const previousLiq = sortedLiqs.find((l) => l.id !== currentLiq?.id) || sortedLiqs[0] || null;

  // Ensure current list of debtors is defined
  const deudoresActuales: Debedor[] = currentLiq?.deudores || [];
  const deudoresPrevios: Debedor[] = previousLiq?.deudores || [];

  // 1. Calculations & Metrics
  const totalPrincipal = deudoresActuales.reduce((sum, d) => sum + d.deuda, 0);
  const totalInterest = deudoresActuales.reduce((sum, d) => sum + d.interes, 0);
  const totalBuildingDebt = totalPrincipal + totalInterest;

  const totalPrincipalPrev = deudoresPrevios.reduce((sum, d) => sum + d.deuda, 0);
  const totalInterestPrev = deudoresPrevios.reduce((sum, d) => sum + d.interes, 0);
  const totalDebtPrev = totalPrincipalPrev + totalInterestPrev;

  // Month-over-month comparisons
  const debtChangeAmount = totalBuildingDebt - totalDebtPrev;
  const debtChangePercentage = totalDebtPrev > 0 ? (debtChangeAmount / totalDebtPrev) * 100 : 0;
  
  const countJudicial = deudoresActuales.filter((d) => d.estado === 'judicial').length;
  const countGrave = deudoresActuales.filter((d) => d.estado === 'grave').length;
  const countAlerta = deudoresActuales.filter((d) => d.estado === 'alerta').length;
  const countLeve = deudoresActuales.filter((d) => d.estado === 'leve').length;

  // 2. Debtor state transition history (MoM tracking)
  const allKnownDepartments = Array.from(
    new Set([
      ...deudoresActuales.map((d) => d.unidad),
      ...deudoresPrevios.map((d) => d.unidad)
    ])
  );

  const trackingComparisons = allKnownDepartments.map((unit) => {
    const act = deudoresActuales.find((d) => d.unidad === unit);
    const prev = deudoresPrevios.find((d) => d.unidad === unit);

    let statusType: 'settled' | 'increased' | 'stable' | 'new_debtor' | 'no_debt' = 'stable';
    let label = 'Estable';

    if (prev && prev.deuda > 0 && (!act || act.deuda === 0)) {
      statusType = 'settled';
      label = 'Deuda Condonada/Saldada 🎉';
    } else if (!prev && act && act.deuda > 0) {
      statusType = 'new_debtor';
      label = 'Nuevo Deudor Inscripto ⚠️';
    } else if (act && prev && act.deuda > prev.deuda) {
      statusType = 'increased';
      label = 'Mora Incrementada';
    } else if (act && prev && act.deuda < prev.deuda) {
      statusType = 'stable';
      label = 'Pago Parcial Realizado';
    } else if (!act && !prev) {
      statusType = 'no_debt';
      label = 'Sin Deuda';
    }

    return {
      unidad: unit,
      nombre: act?.nombre || prev?.nombre || 'S/D',
      deudaAnterior: prev?.deuda || 0,
      deudaMinima: prev ? prev.deuda + prev.interes : 0,
      deudaActual: act?.deuda || 0,
      deudaTotalActual: act ? act.deuda + act.interes : 0,
      mesesPrevios: prev?.mesesAdeudados || 0,
      mesesActuales: act?.mesesAdeudados || 0,
      estadoPrevio: prev?.estado || 'Al día',
      estadoActual: act?.estado || 'Al día',
      statusType,
      label
    };
  }).filter((c) => c.statusType !== 'no_debt');

  // Handle addition of simulated debtor
  const handleAddDebtor = (e: FormEvent) => {
    e.preventDefault();
    if (!currentLiq || !newUnidad || !newNombre || !newDeuda) return;

    const parsedDeb: Debedor = {
      id: `d-custom-${Date.now()}`,
      unidad: newUnidad,
      nombre: newNombre,
      deuda: parseFloat(newDeuda) || 0,
      mesesAdeudados: parseInt(newMeses) || 1,
      interes: parseFloat(newInteres) || 0,
      estado: newEstado
    };

    const updated = [...deudoresActuales, parsedDeb];
    if (onUpdateDeudores) {
      onUpdateDeudores(currentLiq.id, updated);
    }
    
    // Clear states
    setNewUnidad('');
    setNewNombre('');
    setNewDeuda('');
    setNewMeses('');
    setNewInteres('');
    setNewEstado('leve');
    setShowAddForm(false);
  };

  const handleDeleteDebtor = (id: string) => {
    if (!currentLiq) return;
    const updated = deudoresActuales.filter((d) => d.id !== id);
    if (onUpdateDeudores) {
      onUpdateDeudores(currentLiq.id, updated);
    }
  };

  // State coloring map
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'judicial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800 rounded-md">
            🔴 Vía Judicial
          </span>
        );
      case 'grave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 rounded-md animate-pulse">
            ⚠️ Mora Crítica (3+ m)
          </span>
        );
      case 'alerta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 rounded-md">
            🔸 Mora Media (2 m)
          </span>
        );
      case 'leve':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md">
            🔹 Mora Leve (1 m)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 rounded-md">
            Sin Exposición
          </span>
        );
    }
  };

  // Filter actual debtors
  const filteredDeudores = deudoresActuales.filter((d) => {
    const matchesSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.unidad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || d.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  });

  return (
    <div className="space-y-6" id="deudores-panel-root">
      
      {/* 1. STATE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="deudores-stats-cards">
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deuda Edilicia Total</span>
              <Building className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white leading-none">
              {currencyFormatter.format(totalBuildingDebt)}
            </h2>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Capital: {currencyFormatter.format(totalPrincipal)}</span>
            <span className="text-amber-400 font-mono">+{currencyFormatter.format(totalInterest)} Recargo</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Variación Intermensual</span>
              {debtChangeAmount >= 0 ? (
                <TrendingUp className="w-4 h-4 text-rose-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <h2 className={`text-2xl font-black leading-none ${debtChangeAmount >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {debtChangeAmount >= 0 ? '+' : ''}{currencyFormatter.format(debtChangeAmount)}
            </h2>
          </div>
          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed font-semibold">
            Representa un{' '}
            <span className={debtChangeAmount >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {debtChangePercentage.toFixed(1)}% {debtChangeAmount >= 0 ? 'de aumento' : 'de reducción'}
            </span>{' '}
            respecto a {previousLiq?.periodo || 'periodo anterior'}.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unidades Morosas</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">
              {deudoresActuales.filter(d => d.deuda > 0).length} Unidades
            </h2>
          </div>
          <div className="mt-4 flex gap-1.5 flex-wrap">
            {countJudicial > 0 && <span className="text-[9px] bg-rose-950 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-800">{countJudicial} Judicial</span>}
            {countGrave > 0 && <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">{countGrave} Crítico</span>}
            {countAlerta > 0 && <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">{countAlerta} Medio</span>}
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Efectividad de Cobro</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-emerald-950 leading-none">
              {(100 - (currentLiq?.morosos?.porcentajeMorosidad || 0))}%
            </h2>
          </div>
          <p className="mt-4 text-[10px] text-emerald-700 leading-relaxed font-medium">
            Mora actual: {currentLiq?.morosos?.porcentajeMorosidad || 0}%. % de expensas liquidadas ingresados en la cuenta bancaria del consorcio.
          </p>
        </div>
      </div>

      {/* 2. CUSTOM STATS CHARTS & DYNAMIC VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="deudores-charts-and-mo">
        
        {/* Ledger debt by unit - custom SVG / CSS bar chart */}
        <div className="bg-white border border-slate-150 p-5 rounded-2xl space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monto Adeudado por Unidad Funcional (ARS)</h3>
            <p className="text-[11px] text-slate-500">Exposición de deuda activa. Las barras muestran Capital (Gris) más Interés (Oro).</p>
          </div>

          <div className="space-y-3 pt-2">
            {deudoresActuales.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No se han registrado deudores en este mes.</p>
            ) : (
              deudoresActuales.map((d) => {
                const totalItemDebt = d.deuda + d.interes;
                const maxTotalDebt = Math.max(...deudoresActuales.map(x => x.deuda + x.interes), 1);
                const principalPercent = (d.deuda / maxTotalDebt) * 100;
                const interestPercent = (d.interes / maxTotalDebt) * 100;

                return (
                  <div key={d.id} className="space-y-1 group">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {d.unidad} <span className="font-normal text-slate-500 font-mono text-[11px]">({d.nombre})</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {currencyFormatter.format(totalItemDebt)}{' '}
                        {d.interes > 0 && (
                          <span className="text-[10px] text-amber-600 font-normal">
                            (int. {currencyFormatter.format(d.interes)})
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${principalPercent}%` }} 
                        className={`h-full transition-all duration-500 ${
                          d.estado === 'judicial' ? 'bg-rose-900' : 
                          d.estado === 'grave' ? 'bg-red-500' : 'bg-slate-400'
                        }`}
                      />
                      <div 
                        style={{ width: `${interestPercent}%` }} 
                        className="h-full bg-amber-400 transition-all duration-500"
                        title="Interes e intereses punitorios"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm" /> Capital Base
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm" /> Recargos de Interés
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-rose-900 rounded-sm" /> Acceso Judicial
            </span>
          </div>
        </div>

        {/* Debtor progress month-over-month comparisons (Trend tracking) */}
        <div className="bg-white border border-slate-150 p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Rastreador de Transiciones de Mora (MoM)</h3>
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <History className="w-3 h-3" /> {previousLiq?.periodo} ➡️ {currentLiq?.periodo}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Mapeo del estado de cobros. Complatamiento y cumplimiento legal interperiodo.</p>
          </div>

          <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
            {trackingComparisons.map((c, i) => {
              const wasActive = c.deudaAnterior > 0;
              const isActiveNow = c.deudaActual > 0;

              return (
                <div key={i} className="p-3 border border-slate-50 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{c.unidad}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-[11px]">{c.nombre}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-mono">
                        {wasActive ? currencyFormatter.format(c.deudaAnterior) : 'Al día'}
                      </span>
                      <span className="text-slate-400">➡️</span>
                      <span className="font-mono font-bold text-slate-900">
                        {isActiveNow ? currencyFormatter.format(c.deudaActual) : 'Saldada 🎉'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    {c.statusType === 'settled' && (
                      <span className="inline-block text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        Liquidado Completo
                      </span>
                    )}
                    {c.statusType === 'new_debtor' && (
                      <span className="inline-block text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Nueva Entrada Mora
                      </span>
                    )}
                    {c.statusType === 'increased' && (
                      <span className="inline-block text-[9px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                        Mora Acumulante (+{c.mesesActuales - c.mesesPrevios} m)
                      </span>
                    )}
                    {c.statusType === 'stable' && (
                      <span className="inline-block text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        Pago Parcial
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono">
                      {c.estadoPrevio} ➡️ {c.estadoActual}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-[11px] text-slate-600">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Recupero Legal Exitoso:</strong> La unidad de deudor <strong>Piso 8 C (Juan Pérez)</strong> canceló su saldo de $40,000 en Mayo 2026. Se redujo la mora un 16% en dicho nicho.
            </span>
          </div>
        </div>

      </div>

      {/* 3. TABLE SECTION */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden" id="deudores-tablas-central">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Listado Analítico de Deudores</h3>
            <p className="text-xs text-slate-500">Administre y evalúe la nómina de carteras vencidas para este consorcio o expensas.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 transition"
              id="deudores-exportar-pdf-btn"
            >
              <Printer className="w-3.5 h-3.5" />
              Exportar PDF Deudores
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg flex items-center gap-2 transition"
              id="deudores-incorporar-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              Incorporar Deudor
            </button>
          </div>
        </div>

        {/* 3a. Inline Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50 border-b border-slate-100 overflow-hidden"
            >
              <form onSubmit={handleAddDebtor} className="p-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unidad/Depto</label>
                  <input
                    type="text"
                    required
                    placeholder="Piso 1 A"
                    value={newUnidad}
                    onChange={(e) => setNewUnidad(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Copropietario</label>
                  <input
                    type="text"
                    required
                    placeholder="Héctor Méndez"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Principal ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="85000"
                    value={newDeuda}
                    onChange={(e) => setNewDeuda(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meses impagos</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2"
                    value={newMeses}
                    onChange={(e) => setNewMeses(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interés ($)</label>
                  <input
                    type="number"
                    placeholder="4500"
                    value={newInteres}
                    onChange={(e) => setNewInteres(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <div className="flex gap-2">
                    <select
                      value={newEstado}
                      onChange={(e) => setNewEstado(e.target.value as any)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="leve">leve (1 mes)</option>
                      <option value="alerta">alerta (2 meses)</option>
                      <option value="grave">grave (3+ meses)</option>
                      <option value="judicial">Vía Judicial</option>
                    </select>
                    
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3b. Search & Advanced filters */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Copropietario o por Departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase font-black text-[10px] tracking-wider shrink-0">Filtrar Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value="todos">Todos los Estados</option>
              <option value="judicial">🔴 Judicial</option>
              <option value="grave">⚠️ Crítico (3+ meses)</option>
              <option value="alerta">🔸 Medio (2 meses)</option>
              <option value="leve">🔹 Leve (1 mes)</option>
            </select>
          </div>
        </div>

        {/* 3c. Table Element */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                <th className="p-4">Unidad / Depto</th>
                <th className="p-4">Copropietario</th>
                <th className="p-4 text-right">Monto Principal</th>
                <th className="p-4 text-center">Meses Adeudados</th>
                <th className="p-4 text-right">Interés Compuesto</th>
                <th className="p-4 text-right">Total Acumulado</th>
                <th className="p-4">Calificación de Estado</th>
                {onUpdateDeudores && <th className="p-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeudores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Ningún deudor coincide con los criterios de búsqueda o de filtro.
                  </td>
                </tr>
              ) : (
                filteredDeudores.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-900">{d.unidad}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{d.nombre}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-slate-700">
                      {currencyFormatter.format(d.deuda)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        d.mesesAdeudados >= 3 ? 'bg-red-50 text-red-700' :
                        d.mesesAdeudados === 2 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {d.mesesAdeudados} {d.mesesAdeudados === 1 ? 'mes' : 'meses'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-amber-600 font-medium">
                      {currencyFormatter.format(d.interes)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {currencyFormatter.format(d.deuda + d.interes)}
                    </td>
                    <td className="p-4">
                      {getEstadoBadge(d.estado)}
                    </td>
                    {onUpdateDeudores && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteDebtor(d.id)}
                          className="p-1 px-2 text-rose-500 hover:text-rose-800 hover:bg-rose-50 rounded"
                          title="Remover deudor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PDF PRINT CERTIFICATE PREVIEW MODAL */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]"
            >
              
              {/* Header inside modal */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Generador de Documentación Consorcial</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir / Guardar PDF
                  </button>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-1 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="flex-1 overflow-y-auto p-10 bg-white print:p-0" id="print-consorcio-document">
                
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center rounded">
                        <Scale className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h1 className="text-[17px] font-black text-slate-950 uppercase tracking-wide">
                        {currentLiq?.nombreConsorcio || 'Consorcio Arcos 2300'}
                      </h1>
                    </div>
                    <p className="text-xs text-slate-500">Dirección: {currentLiq?.direccion || 'Belgrano, CABA'}</p>
                    <p className="text-xs text-slate-500">C.U.I.T.: {currentLiq?.cuit || '30-71458932-5'}</p>
                  </div>

                  <div className="text-right space-y-1.5">
                    <div className="inline-block bg-slate-100 text-slate-800 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                      Documento Oficial de Auditoría
                    </div>
                    <p className="text-xs text-slate-500 font-semibold text-[11px]">Periodo: {currentLiq?.periodo || 'Mayo 2026'}</p>
                    <p className="text-[10px] text-slate-400">Fecha de Auditoría: {new Date().toLocaleDateString('es-AR')}</p>
                  </div>
                </div>

                {/* Subtitle title */}
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-base font-black text-slate-950 uppercase tracking-widest">
                    CERTIFICADO ANALÍTICO DE MOROSIDAD Y EXPOSICIÓN DE CARTERA
                  </h2>
                  <p className="text-xs text-slate-500 max-w-xl mx-auto italic leading-relaxed">
                    Certificación periódica del estado de deudas de expensas comunes del consorcio, formulado conforme a los principios de transparencia de la Ley 941 de la Ciudad Autónoma de Buenos Aires.
                  </p>
                </div>

                {/* Main statistics of debt under document */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div className="p-4 border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">TOTAL DEUDA PRINCIPAL</p>
                    <p className="text-base font-black text-slate-950 mt-1">{currencyFormatter.format(totalPrincipal)}</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">RECARGO POR INTERESES</p>
                    <p className="text-base font-black text-amber-600 mt-1">+{currencyFormatter.format(totalInterest)}</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">DEUDA CONSOLIDADA TOTAL</p>
                    <p className="text-base font-black text-slate-950 mt-1">{currencyFormatter.format(totalBuildingDebt)}</p>
                  </div>
                </div>

                {/* Table of debtors under PDF */}
                <div className="mb-6">
                  <table className="w-full text-left text-[11px] text-slate-800 border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900 bg-slate-50 font-bold text-slate-950 font-sans tracking-wide">
                        <th className="py-2.5 px-2">Unidad</th>
                        <th className="py-2.5 px-2">Nombre Copropietario</th>
                        <th className="py-2.5 px-2 text-right">Deuda Base</th>
                        <th className="py-2.5 px-2 text-center">Meses Mora</th>
                        <th className="py-2.5 px-2 text-right">Intereses</th>
                        <th className="py-2.5 px-2 text-right">Deuda Total</th>
                        <th className="py-2.5 px-2">Estado Judicial/Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {deudoresActuales.map((d) => (
                        <tr key={d.id}>
                          <td className="py-2.5 px-2 font-bold">{d.unidad}</td>
                          <td className="py-2.5 px-2">{d.nombre}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{currencyFormatter.format(d.deuda)}</td>
                          <td className="py-2.5 px-2 text-center font-bold">{d.mesesAdeudados}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-amber-700">{currencyFormatter.format(d.interes)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-950">{currencyFormatter.format(d.deuda + d.interes)}</td>
                          <td className="py-2.5 px-2 uppercase font-mono font-bold text-[9px]">
                            {d.estado === 'judicial' ? '🔴 Acciones Judiciales Iniciadas' :
                             d.estado === 'grave' ? '🔴 Mora Crítica Reincidente' :
                             d.estado === 'alerta' ? '🟡 Mora Moderada Activa' : '🟢 Mora Leve'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legal notes references */}
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 mb-8">
                  <div className="flex gap-1 items-center">
                    <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase">Consideraciones de Rigor de Ley (CABA / Código Civil)</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    1. <strong>Obligación de Contribución:</strong> Conforme al Código Civil y Comercial de la Nación (CCyCN) Art. 2048, todo propietario debe contribuir al pago de expensas comunes ordinarias y extraordinarias dispuestas por el reglamento o resueltas por asamblea consorcial.
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    2. <strong>Tasas de Interés Aplicadas:</strong> Los recargos liquidados corresponden a tasas punitorias y compensatorias aprobadas legalmente en asamblea o por el Reglamento de Copropiedad del consorcio (CABA), calculadas en base a prorrateo por mes vencido.
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    3. <strong>Vía Ejecutiva Directa:</strong> Las deudas de expensas certificadas con la firma de la administración y el consejo constituyen título ejecutivo para el cobro por vía de ejecución directa acelerada ante la Justicia Civil de CABA.
                  </p>
                </div>

                {/* Footer and Sign Block */}
                <div className="flex justify-between items-end pt-8 border-t border-dashed border-slate-300">
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400">Software de Auditoría Legal Expensas CABA · Versión 3.2.0</p>
                    <p className="text-[9px] text-slate-400 font-mono">UID: {currentLiq?.id}</p>
                  </div>

                  <div className="text-center w-60 space-y-1">
                    <div className="w-full border-t border-slate-900 mx-auto pt-2" />
                    <p className="text-[11px] font-bold text-slate-950 uppercase tracking-widest leading-none">
                      Administración Consorcial
                    </p>
                    <p className="text-[10px] text-slate-400">Firma Registrada & Consejo de Propietarios</p>
                  </div>
                </div>

              </div>

              {/* Modal footer print info */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 print:hidden">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold transition"
                >
                  Cerrar Vista Previa
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Certificado
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
