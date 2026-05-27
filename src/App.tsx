/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Sparkles,
  MessageSquare,
  BarChart3,
  ListFilter,
  DollarSign,
  Building,
  RefreshCw,
  Info,
  ChevronRight,
  ArrowRight,
  Send,
  Loader2,
  FileCheck,
  Building2,
  Users,
  Briefcase,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidacionData, GastoItem, AlertaAuditoria, InformeAuditoria, ChatMessage, Debedor } from './types';
import UploadZone from './components/UploadZone';
import DashboardScores from './components/DashboardScores';
import DeudoresPanel from './components/DeudoresPanel';

export default function App() {
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionData[]>([]);
  const [activeLiqId, setActiveLiqId] = useState<string | null>(null);
  const [auditoria, setAuditoria] = useState<InformeAuditoria | null>(null);
  
  // Dashboard visual state
  const [activeSubTab, setActiveSubTab] = useState<'resumen' | 'alertas' | 'comparativa' | 'tablas-gastos' | 'normativa' | 'deudores'>('resumen');
  const [searchGastoQuery, setSearchGastoQuery] = useState('');
  const [filterGastoCategoria, setFilterGastoCategoria] = useState<string>('todos');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Editable row states
  const [editingGastoId, setEditingGastoId] = useState<string | null>(null);
  const [editGastoState, setEditGastoState] = useState<Partial<GastoItem>>({});

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatPending, setIsChatPending] = useState(false);

  // Selected Alerta filter
  const [selectedAlertaFilter, setSelectedAlertaFilter] = useState<'todas' | 'danger' | 'warning' | 'success'>('todas');

  const activeLiq = liquidaciones.find((l) => l.id === activeLiqId) || liquidaciones[0] || null;

  // Sync initial configuration
  useEffect(() => {
    if (liquidaciones.length > 0 && !activeLiqId) {
      setActiveLiqId(liquidaciones[0].id);
    }
  }, [liquidaciones, activeLiqId]);

  // Run audit evaluation
  const runAuditAnalysis = async (customLiqList: LiquidacionData[] = liquidaciones) => {
    if (customLiqList.length === 0) return;
    setIsAuditing(true);
    try {
      const response = await fetch('/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liquidaciones: customLiqList }),
      });

      if (!response.ok) {
        throw new Error('No se pudo calcular la auditoría avanzada.');
      }

      const report: InformeAuditoria = await response.json();
      setAuditoria(report);

      // Seed chat assistant standard welcome prompt based on audit
      const welcomeMsg: ChatMessage = {
        id: `m-welcome`,
        sender: 'assistant',
        text: `¡Hola! Soy tu **Asesor Experto en Expensas CABA** de Inteligencia Artificial. 

He auditado la liquidación de **${customLiqList[0].nombreConsorcio}** correspondiente a **${customLiqList[0].periodo}** (y ${customLiqList.length > 1 ? `${customLiqList.length - 1} período(s) histórico(s)` : 'sus datos actuales'}).

**Hallazgos inmediatos destacados:**
- **Riesgo administrativo estimado**: \`${report.scoreRiesgoAdministrativo}%\` ${report.scoreRiesgoAdministrativo > 50 ? '⚠️ (Atención a los aumentos y comprobantes)' : '✅ (Nivel adecuado y transparente)'}
- **Puntuación de transparencia documental**: \`${report.scoreTransparencia}%\`
- Detecté **${report.alertas.length} alertas** críticas que te recomiendo revisar.

¿De qué gasto te gustaría hablar hoy? Podés preguntarme cosas como:
* *"¿Por qué es tan alto el costo de mantenimiento?"*
* *"¿Hay proveedores dudosos o sin factura?"*
* *"¿Qué normas de CABA podrían estar incumpliéndose?"*`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages([welcomeMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Add parsed liquidations
  const handleParsed = (newL: LiquidacionData) => {
    const updated = [newL, ...liquidaciones];
    setLiquidaciones(updated);
    setActiveLiqId(newL.id);
    runAuditAnalysis(updated);
  };

  // Load standard Demo datasets
  const loadDemoConsorcio = (demos: LiquidacionData[]) => {
    setLiquidaciones(demos);
    setActiveLiqId(demos[1].id); // mayo 2026 is active
    runAuditAnalysis(demos);
  };

  // Update debtors list in state
  const handleUpdateDeudores = (liqId: string, updatedDeudores: Debedor[]) => {
    const updated = liquidaciones.map((l) => {
      if (l.id === liqId) {
        return {
          ...l,
          deudores: updatedDeudores,
        };
      }
      return l;
    });
    setLiquidaciones(updated);
  };

  // Edit Expense rows inline
  const startEditGasto = (gasto: GastoItem) => {
    setEditingGastoId(gasto.id);
    setEditGastoState({ ...gasto });
  };

  const saveEditGasto = () => {
    if (!editingGastoId || !activeLiq) return;

    const updatedGastos = activeLiq.gastos.map((g) => {
      if (g.id === editingGastoId) {
        return {
          ...g,
          ...editGastoState,
          monto: Number(editGastoState.monto) || 0,
        };
      }
      return g;
    });

    // Calculate sum of individual items for structural safety
    const computedTotal = updatedGastos.reduce((acc, curr) => acc + curr.monto, 0);

    const updatedLiq: LiquidacionData = {
      ...activeLiq,
      gastos: updatedGastos,
      totalGastos: computedTotal, // synchronize sum
    };

    const updatedList = liquidaciones.map((l) => (l.id === activeLiq.id ? updatedLiq : l));
    setLiquidaciones(updatedList);
    setEditingGastoId(null);
    setEditGastoState({});

    // Trigger silent recalculation of indicators
    runAuditAnalysis(updatedList);
  };

  const handleEditChange = (field: keyof GastoItem, val: any) => {
    setEditGastoState((prev) => ({ ...prev, [field]: val }));
  };

  // Add raw new Expense
  const addGastoRow = () => {
    if (!activeLiq) return;
    const newG: GastoItem = {
      id: `g-custom-${Date.now()}`,
      categoria: 'otros',
      concepto: 'Nuevo gasto ingresado manualmente',
      proveedor: 'Pendiente',
      monto: 10000,
      comprobante: 'Sin Comprobante',
      esExtraordinario: false,
    };

    const updatedLiq = {
      ...activeLiq,
      gastos: [...activeLiq.gastos, newG],
      totalGastos: activeLiq.totalGastos + 10000,
    };

    const updatedList = liquidaciones.map((l) => (l.id === activeLiq.id ? updatedLiq : l));
    setLiquidaciones(updatedList);
    runAuditAnalysis(updatedList);
  };

  // Remove individual expense row
  const deleteGastoRow = (id: string) => {
    if (!activeLiq) return;
    const targetGasto = activeLiq.gastos.find((g) => g.id === id);
    if (!targetGasto) return;

    const filtered = activeLiq.gastos.filter((g) => g.id !== id);
    const updatedLiq = {
      ...activeLiq,
      gastos: filtered,
      totalGastos: Math.max(0, activeLiq.totalGastos - targetGasto.monto),
    };

    const updatedList = liquidaciones.map((l) => (l.id === activeLiq.id ? updatedLiq : l));
    setLiquidaciones(updatedList);
    runAuditAnalysis(updatedList);
  };

  // Chat helper
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatPending) return;

    const userMsg: ChatMessage = {
      id: `m-usr-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const originalInput = chatInput;
    setChatInput('');
    setIsChatPending(true);

    try {
      const response = await fetch('/api/audit/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
          liquidaciones,
          auditoria,
        }),
      });

      if (!response.ok) {
        throw new Error('Fallo la respuesta de la IA.');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `m-bot-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Sin respuesta inteligente del auditor.',
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `m-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Error de conexión con la IA**: ${err.message || 'No se pudo conectar con el servicio remoto.'}`,
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatPending(false);
    }
  };

  // Total calculated versus what they declare
  const getCalculatedSum = (liq: LiquidacionData) => {
    return liq.gastos.reduce((sum, g) => sum + g.monto, 0);
  };

  const getCategorizedSums = (liq: LiquidacionData) => {
    const counts: Record<string, number> = {
      sueldos_cargas: 0,
      mantenimiento: 0,
      servicios: 0,
      honorarios_administracion: 0,
      seguros: 0,
      gastos_bancarios: 0,
      otros: 0,
    };
    liq.gastos.forEach((g) => {
      const cat = g.categoria || 'otros';
      if (counts[cat] !== undefined) {
        counts[cat] += g.monto;
      } else {
        counts['otros'] += g.monto;
      }
    });
    return counts;
  };

  const getFriendlyCategoryLabel = (cat: string) => {
    const mapping: Record<string, string> = {
      sueldos_cargas: 'Sueldos y Cargas Sociales',
      mantenimiento: 'Mantenimiento y Conservación',
      servicios: 'Servicios Públicos (Luz/Gas/Agua)',
      honorarios_administracion: 'Honorarios Administración',
      seguros: 'Seguros Edificio/ART/Vida',
      gastos_bancarios: 'Gastos de Cuenta y Banco',
      otros: 'Otros Gastos Ordinarios',
    };
    return mapping[cat] || cat;
  };

  const getFriendlyCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      sueldos_cargas: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      mantenimiento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      servicios: 'bg-sky-50 text-sky-700 border-sky-100',
      honorarios_administracion: 'bg-amber-50 text-amber-700 border-amber-100',
      seguros: 'bg-teal-50 text-teal-700 border-teal-100',
      gastos_bancarios: 'bg-rose-50 text-rose-700 border-rose-100',
      otros: 'bg-slate-50 text-slate-700 border-slate-100',
    };
    return colors[cat] || 'bg-slate-50 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 selection:bg-emerald-100" id="auditor-body-app">
      {/* PROFESSIONAL PREMIUM NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100" id="header-nav-comp">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-emerald-600 block leading-tight">CABA Legal-Tech</span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Auditoría Novas<sup>®</sup></h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {liquidaciones.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle className="w-3.5 h-3.5" />
                Auditoría Activa
              </span>
            )}
            <button
              onClick={() => window.print()}
              disabled={liquidaciones.length === 0}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 transition-all flex items-center gap-2"
              id="print-top-bar-btn"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Imprimir Certificado
            </button>
          </div>
        </div>
      </header>

      {/* DETAILED PRINTABLE OUTFLOWS */}
      {activeLiq && auditoria && (
        <div className="hidden print:block p-8 bg-white text-slate-950 font-serif" id="print-area-wrapper">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">DIAGNÓSTICO TÉCNICO DE AUDITORÍA DE EXPENSAS</h1>
            <p className="text-xs font-sans text-slate-500 uppercase mt-1">Conforme a Ley 941 de CABA & Prácticas Contables Consorciales Argentinas</p>
          </div>

          <div className="border border-slate-300 rounded-lg p-4 mb-4 grid grid-cols-2 gap-4 text-xs font-sans bg-slate-50">
            <div>
              <p><strong>Consorcio:</strong> {activeLiq.nombreConsorcio}</p>
              <p><strong>Dirección:</strong> {activeLiq.direccion}</p>
              <p><strong>Cuit:</strong> {activeLiq.cuit}</p>
              <p><strong>Administrador:</strong> {activeLiq.administrador}</p>
            </div>
            <div className="text-right">
              <p><strong>Período Auditado:</strong> {activeLiq.periodo}</p>
              <p><strong>Gastos Totales Auditados:</strong> ${activeLiq.totalGastos.toLocaleString('es-AR')}</p>
              <p><strong>Score de Transparencia:</strong> {auditoria.scoreTransparencia}%</p>
              <p><strong>Score de Riesgo Administrativo:</strong> {auditoria.scoreRiesgoAdministrativo}%</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">RESUMEN EJECUTIVO</h2>
            <p className="text-xs leading-relaxed italic">{auditoria.resumenEjecutivo}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">ALERTAS CRÍTICAS / HALLAZGOS</h2>
            <div className="space-y-2">
              {auditoria.alertas.map((a, i) => (
                <div key={i} className="text-xs border-l-2 p-2 border-slate-600 bg-slate-50">
                  <p className="font-bold uppercase tracking-tight text-[10px]">{a.categoria} • RIESGO {a.tipo.toUpperCase()}</p>
                  <p className="font-semibold">{a.titulo}</p>
                  <p className="text-[11px] text-slate-700">{a.descripcion}</p>
                  <p className="text-[10px] italic mt-1 text-emerald-800">Sugerencia: {a.sugerenciaAccion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold border-b border-slate-300 pb-1 mb-2">CONTRALOR DE EXPENSAS POR CATEGORÍA</h2>
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100">
                  <th className="py-1 px-2">Categoría</th>
                  <th className="py-1 px-2 text-right">Monto Declarado</th>
                  <th className="py-1 px-2 text-right">% Participación</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(getCategorizedSums(activeLiq)).map(([cat, sum]) => (
                  <tr key={cat} className="border-b border-slate-200">
                    <td className="py-1 px-2">{getFriendlyCategoryLabel(cat)}</td>
                    <td className="py-1 px-2 text-right">${sum.toLocaleString('es-AR')}</td>
                    <td className="py-1 px-2 text-right">
                      {activeLiq.totalGastos > 0 ? ((sum / activeLiq.totalGastos) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center text-[10px] border-t border-slate-300 pt-3 font-sans">
            <p>Este informe se genera a partir del procesamiento OCR semántico de inteligencia artificial de Auditoría Novas CABA.</p>
            <p>Dirección General de Defensa y Protección al Consumidor (Ley 941 CABA) - Auditoría Externa</p>
          </div>
        </div>
      )}

      {/* MAIN SCREEN GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:hidden" id="main-web-view">
        
        {/* WELCOME SECTION */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="headline-consorcio-block">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full mb-2">
              <Layers className="w-3.5 h-3.5" />
              Auditor Contable Virtual
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Expensas Transparentes CABA</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Cargá múltiples liquidaciones, editá conceptos particulares y detectá abusos edilicios, paritarias sospechosas de SUTERH, tasas fantasmas y desbalances automáticamente.
            </p>
          </div>
          
          <div className="flex gap-2">
            {liquidaciones.length > 0 && (
              <button
                onClick={() => setLiquidaciones([])}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
              >
                Limpiar datos
              </button>
            )}
          </div>
        </div>

        {/* COMPONENT RENDER DEPENDING ON STATUS */}
        {liquidaciones.length === 0 ? (
          <div className="max-w-3xl mx-auto py-12" id="upload-stage-wrapper">
            <UploadZone
              onParsed={handleParsed}
              onLoadDemos={loadDemoConsorcio}
              isLoading={isUploading}
              setIsLoading={setIsUploading}
            />
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6" id="why-audit-info-grid">
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">OCR Inteligente Consorcial</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Basta de tipear planillas tediosas de expensas. La IA lee el escaneo y separa automáticamente los sueldos, cargas AFIP (F931) y abonos de ascensores.
                </p>
              </div>

              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Certeza Legal Local</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cruzamos datos con las paritarias vigentes del Suterh, abonos obligatorios de CABA y Ley 941 de Administradores para verificar anomalías de tarifas.
                </p>
              </div>

              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Comparativa de Tendencias</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Subí dos o más períodos y observá la evolución real acumulada de gastos contra estimaciones de inflación y proveedores sospechosos.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-active-grid">
            
            {/* LEFT / CENTER PANEL (SPAN 2): SCORES, METRIC CHARTS & DETAILED LIST */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* CONSORCIO IDENTIFIER BOARD */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="consorcio-active-card">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Building2 className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">{activeLiq ? activeLiq.nombreConsorcio : 'Sin Consorcio asignado'}</h3>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">CUIT: {activeLiq?.cuit}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      Dirección: <span className="text-slate-800">{activeLiq?.direccion}</span>
                      • Admin: <span className="text-slate-800 font-medium">{activeLiq?.administrador}</span>
                    </p>
                  </div>
                </div>

                {/* PERIOD SELECTOR PILL */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-500">Período:</span>
                  <select
                    value={activeLiqId || ''}
                    onChange={(e) => setActiveLiqId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl focus:outline-none focus:border-slate-500 cursor-pointer shadow-sm flex-1 sm:flex-initial"
                    id="period-active-selector"
                  >
                    {liquidaciones.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.periodo} {l.id.includes('demo') ? '(Demo)' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      // Allow uploading another one
                      const input = document.getElementById('dialog-upload-input');
                      if (input) input.click();
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 bg-white shadow-sm shrink-0"
                    title="Añadir otra liquidación para comparar"
                    id="add-another-period-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    id="dialog-upload-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async () => {
                          setIsUploading(true);
                          const response = await fetch('/api/audit/parse', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: file.name, mimeType: file.type, base64: (reader.result as string).split(',')[1] }),
                          });
                          if (response.ok) {
                            const parsed = await response.json();
                            handleParsed({ ...parsed, id: `liq-${Date.now()}`, fileName: file.name });
                          } else {
                            alert('No se pudo analizar el archivo subido.');
                          }
                          setIsUploading(false);
                        };
                      }
                    }}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                </div>
              </div>

              {/* AUDITOR SCORE GAUGES */}
              {isAuditing ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Ejecutando algoritmos contables y auditoría inteligente de CABA...</p>
                  <p className="text-xs text-slate-400 mt-1">Evaluando paritarias FATERYH, F931 de AFIP y buscando irregularidades o duplicados...</p>
                </div>
              ) : auditoria ? (
                <DashboardScores
                  scoreTransparencia={auditoria.scoreTransparencia}
                  scoreRiesgoAdministrativo={auditoria.scoreRiesgoAdministrativo}
                  scoreSaludFinanciera={auditoria.scoreSaludFinanciera}
                />
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center">
                  <p className="text-sm text-slate-600">Calculando indicadores con Inteligencia Artificial...</p>
                  <button
                    onClick={() => runAuditAnalysis()}
                    className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                  >
                    Ejecutar Auditoría Inicial
                  </button>
                </div>
              )}

              {/* NAVIGATION SUB-TABS */}
              <div className="flex border-b border-slate-200 mt-6" id="dashboard-navbar-nav">
                <button
                  onClick={() => setActiveSubTab('resumen')}
                  className={`py-3 px-4 font-semibold text-xs tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all ${
                    activeSubTab === 'resumen'
                      ? 'border-slate-950 text-slate-950 bg-white/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="tab-btn-resumen"
                >
                  <Building className="w-3.5 h-3.5" />
                  Resumen Ejecutivo
                </button>
                <button
                  onClick={() => setActiveSubTab('alertas')}
                  className={`py-3 px-4 font-semibold text-xs tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all relative ${
                    activeSubTab === 'alertas'
                      ? 'border-slate-950 text-slate-950 bg-white/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="tab-btn-alertas"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Alertas de Gestión
                  {auditoria && auditoria.alertas.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                  )}
                </button>
                <button
                  onClick={() => setActiveSubTab('tablas-gastos')}
                  className={`py-3 px-4 font-semibold text-xs tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all ${
                    activeSubTab === 'tablas-gastos'
                      ? 'border-slate-950 text-slate-950 bg-white/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="tab-btn-tablas"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Gastos Structurado ({activeLiq ? activeLiq.gastos.length : 0})
                </button>
                <button
                  onClick={() => setActiveSubTab('deudores')}
                  className={`py-3 px-4 font-semibold text-xs tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all relative ${
                    activeSubTab === 'deudores'
                      ? 'border-slate-950 text-slate-950 bg-white/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="tab-btn-deudores"
                >
                  <Users className="w-3.5 h-3.5" />
                  Deudores
                  {activeLiq && activeLiq.deudores && activeLiq.deudores.filter(d => d.deuda > 0).length > 0 && (
                    <span className="bg-rose-500 text-white rounded-full text-[8px] w-3.5 h-3.5 flex items-center justify-center font-bold">
                      {activeLiq.deudores.filter(d => d.deuda > 0).length}
                    </span>
                  )}
                </button>
                {liquidaciones.length > 1 && (
                  <button
                    onClick={() => setActiveSubTab('comparativa')}
                    className={`py-3 px-4 font-semibold text-xs tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'comparativa'
                        ? 'border-slate-950 text-slate-950 bg-white/50 rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    id="tab-btn-comparativa"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Comparaciones ({liquidaciones.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveSubTab('normativa')}
                  className={`py-3 px-4 font-semibold text-xs tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all ${
                    activeSubTab === 'normativa'
                      ? 'border-slate-950 text-slate-950 bg-white/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="tab-btn-normas"
                >
                  <Info className="w-3.5 h-3.5" />
                  Leyes CABA
                </button>
              </div>

              {/* RENDER CONTENT PANELS */}
              <div className="min-h-[300px]">
                
                {/* 1. RESUMEN EJECUTIVO PANEL */}
                {activeSubTab === 'resumen' && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6" id="panel-resumen">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Diagnóstico Global del Liquidador
                      </h3>
                      {auditoria ? (
                        <div className="text-sm text-slate-600 space-y-4 leading-relaxed">
                          <p className="bg-slate-50 p-4 border-l-4 border-emerald-500 rounded-r-xl italic text-slate-700">
                            "{auditoria.resumenEjecutivo}"
                          </p>
                          <div className="pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Observaciones Críticas de Liquidación:</h4>
                            <p className="text-xs text-slate-600">{auditoria.observacionesDetalladas}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Analizando el documento...</p>
                      )}
                    </div>

                    {/* DYNAMIC SUMS VALIDATION WARNING */}
                    {activeLiq && (
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/55 flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Contraloría Matemática Interna</h4>
                          <p className="text-xs text-slate-400 mt-1">Comprobamos si el total de gastos declarado coincide con la sumatoria estricta de las líneas detalladas.</p>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Total Sumado: <span className="font-mono font-bold text-slate-800">${getCalculatedSum(activeLiq).toLocaleString('es-AR')}</span></p>
                            <p className="text-xs text-slate-500">Total Declarado: <span className="font-mono font-bold text-slate-800">${activeLiq.totalGastos.toLocaleString('es-AR')}</span></p>
                          </div>
                          {Math.abs(getCalculatedSum(activeLiq) - activeLiq.totalGastos) < 10 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1.5 self-end">
                              ● Coincidencia Perfecta (Sin Diferencias)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full mt-1.5 self-end">
                              ⚠️ Diferencia S/D: ${(Math.abs(getCalculatedSum(activeLiq) - activeLiq.totalGastos)).toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* GENERAL FINANCE STATISTICS CARD */}
                    {activeLiq && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Fondos de Reserva</span>
                            <h4 className="text-lg font-bold text-slate-800 mt-0.5">
                              ${activeLiq.fondos?.fondoReservaActivo ? activeLiq.fondos.fondoReservaActivo.toLocaleString('es-AR') : 'Sin Datos'}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Aporte del mes: ${activeLiq.fondos?.aporteFondoReserva?.toLocaleString('es-AR') || 'S/D'}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-emerald-600">
                            <FileCheck className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Copetrol / Morosidad</span>
                            <h4 className="text-lg font-bold text-rose-600 mt-0.5">
                              {activeLiq.morosos?.porcentajeMorosidad ? `${activeLiq.morosos.porcentajeMorosidad}%` : 'S/D'}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Deben: ${activeLiq.morosos?.totalMorosos ? activeLiq.morosos.totalMorosos.toLocaleString('es-AR') : 'S/D'} ({activeLiq.morosos?.cantidadMorosos || 0} UF)
                            </p>
                          </div>
                          <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center ${activeLiq.morosos && activeLiq.morosos.porcentajeMorosidad > 15 ? 'text-rose-600' : 'text-slate-400'}`}>
                            <Users className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ALERTAS DE GESTION PANEL */}
                {activeSubTab === 'alertas' && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4" id="panel-alertas">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Análisis Inteligente de Alertas</h3>
                        <p className="text-xs text-slate-500">Hallazgos ordenados por nivel de riesgo y categoría de gestión.</p>
                      </div>

                      {/* FILTER BUTTONS PILLS */}
                      <div className="flex flex-wrap gap-1">
                        {(['todas', 'danger', 'warning', 'success'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setSelectedAlertaFilter(lvl)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize border ${
                              selectedAlertaFilter === lvl
                                ? 'bg-slate-950 text-white border-slate-950'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {lvl === 'todas' ? 'Todas' : lvl === 'danger' ? 'Graves (Rojo)' : lvl === 'warning' ? 'Observaciones (Amarillo)' : 'Correctos (Verde)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {auditoria ? (
                        (() => {
                          const list = auditoria.alertas.filter(
                            (a) => selectedAlertaFilter === 'todas' || a.tipo === selectedAlertaFilter
                          );
                          if (list.length === 0) {
                            return (
                              <div className="p-8 text-center border border-slate-100 rounded-xl bg-slate-50 flex flex-col items-center">
                                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                                <p className="text-xs text-slate-600 font-bold">¡No se encontraron alertas en este nivel!</p>
                                <p className="text-xs text-slate-400">Todo el desglose parece correcto u optimizado.</p>
                              </div>
                            );
                          }

                          return list.map((alerta) => (
                            <motion.div
                              key={alerta.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-5 rounded-2xl border flex gap-4 transition-all ${
                                alerta.tipo === 'danger'
                                  ? 'bg-rose-50/70 border-rose-100 hover:bg-rose-50'
                                  : alerta.tipo === 'warning'
                                  ? 'bg-amber-50/70 border-amber-100 hover:bg-amber-50'
                                  : 'bg-emerald-50/70 border-emerald-100 hover:bg-emerald-50'
                              }`}
                            >
                              <div className="shrink-0">
                                {alerta.tipo === 'danger' ? (
                                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                                    <AlertTriangle className="w-5 h-5" />
                                  </div>
                                ) : alerta.tipo === 'warning' ? (
                                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                                    <AlertTriangle className="w-5 h-5" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                    <CheckCircle className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-800">{alerta.titulo}</h4>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
                                    {alerta.categoria}
                                  </span>
                                  {alerta.montoAsociado && (
                                    <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.2">
                                      ${alerta.montoAsociado.toLocaleString('es-AR')}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {alerta.descripcion}
                                </p>
                                {alerta.gastoReferencia && (
                                  <p className="text-[10px] text-slate-400 italic">
                                    Concepto auditado: "{alerta.gastoReferencia}"
                                  </p>
                                )}
                                <div className="pt-2 border-t border-slate-100 mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                                  <span>Acción recomendada: <span className="text-slate-800 font-medium font-sans">{alerta.sugerenciaAccion}</span></span>
                                </div>
                              </div>
                            </motion.div>
                          ));
                        })()
                      ) : (
                        <p className="text-sm text-slate-400">Ejecutá un diagnóstico para ver las sugerencias.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. STRUCTURATED AND EDITABLE EXPENSES TABLE PANEL */}
                {activeSubTab === 'tablas-gastos' && activeLiq && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4" id="panel-tabla-gastos">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Listado Estructurado de Egresos</h3>
                        <p className="text-xs text-slate-500">
                          Podés modificar descripciones o importes en vivo si el OCR omitió algún carácter o si querés simular variaciones de asambleas.
                        </p>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Buscar concepto o proveedor..."
                          value={searchGastoQuery}
                          onChange={(e) => setSearchGastoQuery(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-slate-400 flex-1 sm:w-60"
                        />
                        <select
                          value={filterGastoCategoria}
                          onChange={(e) => setFilterGastoCategoria(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl cursor-pointer"
                        >
                          <option value="todos">Todas las categorías</option>
                          <option value="sueldos_cargas">Sueldos y Cargas</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="servicios">Servicios Públicos</option>
                          <option value="honorarios_administracion">Honorarios</option>
                          <option value="seguros">Seguros</option>
                          <option value="gastos_bancarios">Gastos Bancarios</option>
                          <option value="otros">Otros</option>
                        </select>

                        <button
                          onClick={addGastoRow}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                          title="Agregar gasto manual"
                          id="add-custom-gasto-btn"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar Gasto
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
                            <th className="p-3 w-1/4">Concepto / Descripción</th>
                            <th className="p-3">Categoría</th>
                            <th className="p-3">Proveedor</th>
                            <th className="p-3 font-mono">Monto</th>
                            <th className="p-3">Comprobante</th>
                            <th className="p-3 text-center">Tipo</th>
                            <th className="p-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const filtered = activeLiq.gastos.filter((g) => {
                              const matchesSearch =
                                g.concepto.toLowerCase().includes(searchGastoQuery.toLowerCase()) ||
                                g.proveedor.toLowerCase().includes(searchGastoQuery.toLowerCase());
                              const matchesCat =
                                filterGastoCategoria === 'todos' || g.categoria === filterGastoCategoria;
                              return matchesSearch && matchesCat;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="p-8 text-center text-slate-400">
                                    No se encontraron gastos que coincidan con la búsqueda.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((gasto) => {
                              const isEditing = editingGastoId === gasto.id;
                              return (
                                <tr key={gasto.id} className="hover:bg-slate-50/50 transition-colors">
                                  {isEditing ? (
                                    <>
                                      {/* Editing fields */}
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editGastoState.concepto || ''}
                                          onChange={(e) => handleEditChange('concepto', e.target.value)}
                                          className="w-full p-1 bg-white border border-slate-300 rounded focus:outline-none"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <select
                                          value={editGastoState.categoria || 'otros'}
                                          onChange={(e) => handleEditChange('categoria', e.target.value as any)}
                                          className="w-full p-1 bg-white border border-slate-300 rounded focus:outline-none"
                                        >
                                          <option value="sueldos_cargas">Sueldos y Cargas</option>
                                          <option value="mantenimiento">Mantenimiento</option>
                                          <option value="servicios">Servicios Públicos</option>
                                          <option value="honorarios_administracion">Honorarios</option>
                                          <option value="seguros">Seguros</option>
                                          <option value="gastos_bancarios">Gastos Bancarios</option>
                                          <option value="otros">Otros</option>
                                        </select>
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editGastoState.proveedor || ''}
                                          onChange={(e) => handleEditChange('proveedor', e.target.value)}
                                          className="w-full p-1 bg-white border border-slate-300 rounded focus:outline-none"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="number"
                                          value={editGastoState.monto || 0}
                                          onChange={(e) => handleEditChange('monto', e.target.value)}
                                          className="w-24 p-1 bg-white border border-slate-300 rounded focus:outline-none font-mono"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editGastoState.comprobante || ''}
                                          onChange={(e) => handleEditChange('comprobante', e.target.value)}
                                          className="w-full p-1 bg-white border border-slate-300 rounded focus:outline-none"
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <label className="inline-flex items-center gap-1 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={!!editGastoState.esExtraordinario}
                                            onChange={(e) => handleEditChange('esExtraordinario', e.target.checked)}
                                          />
                                          <span className="text-[10px]">Extraord.</span>
                                        </label>
                                      </td>
                                      <td className="p-2 text-right space-x-1 shrink-0">
                                        <button
                                          onClick={saveEditGasto}
                                          className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700"
                                        >
                                          Guardar
                                        </button>
                                        <button
                                          onClick={() => setEditingGastoId(null)}
                                          className="px-2 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold rounded hover:bg-slate-200"
                                        >
                                          Cancelar
                                        </button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      {/* Read-only fields */}
                                      <td className="p-3 font-medium text-slate-800">{gasto.concepto}</td>
                                      <td className="p-3">
                                        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${getFriendlyCategoryColor(gasto.categoria)}`}>
                                          {getFriendlyCategoryLabel(gasto.categoria)}
                                        </span>
                                      </td>
                                      <td className="p-3 text-slate-500 font-sans">{gasto.proveedor}</td>
                                      <td className="p-3 font-mono font-bold text-slate-800">${gasto.monto.toLocaleString('es-AR')}</td>
                                      <td className="p-3">
                                        <span className="text-slate-400 font-mono text-[11px] block">{gasto.comprobante || 'S/D'}</span>
                                      </td>
                                      <td className="p-3 text-center">
                                        {gasto.esExtraordinario ? (
                                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-indigo-100 text-indigo-800 rounded">Extraord.</span>
                                        ) : (
                                          <span className="px-2 py-0.5 text-[9px] font-semibold text-slate-400">Ordinario</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                        <button
                                          onClick={() => startEditGasto(gasto)}
                                          className="p-1 rounded bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 inline-flex"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => deleteGastoRow(gasto.id)}
                                          className="p-1 rounded bg-slate-50 text-rose-500 hover:text-rose-700 hover:bg-rose-50 inline-flex"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. HISTORIC COMPARISON PANEL */}
                {activeSubTab === 'comparativa' && liquidaciones.length > 1 && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6" id="panel-comparativa">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Evolución de Egresos Mensual</h3>
                      <p className="text-xs text-slate-500">Visualización de tendencias y aumentos acumulados de gastos consorciales.</p>
                    </div>

                    {/* INTERACTIVE COMPARISON CHART GRAPH BY CATEGORIES OR SUMS (SVG) */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-center">
                      <div className="flex-1 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Evolución de Expensas Totales</h4>
                        <div className="space-y-4 w-full">
                          {liquidaciones.map((l) => {
                            const maxLimit = Math.max(...liquidaciones.map(li => li.totalGastos), 1);
                            const parsedPercentage = (l.totalGastos / maxLimit) * 100;
                            return (
                              <div key={l.id} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                  <span>{l.periodo}</span>
                                  <span className="font-mono">${l.totalGastos.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="w-full bg-slate-200/60 rounded-full h-4 relative overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${parsedPercentage}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className="bg-gradient-to-r from-slate-900 to-slate-700 h-full rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="w-full md:w-1/3 bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                        <Sparkles className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-slate-800">Incremento Mayor del Período</h4>
                        {auditoria?.variacionPeriodos && auditoria.variacionPeriodos.length > 0 ? (
                          (() => {
                            const item = auditoria.variacionPeriodos[0];
                            return (
                              <div className="mt-2 space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{item.periodoAnterior} ➜ {item.periodoActual}</p>
                                <p className="text-2xl font-black text-rose-600">+{item.porcentajeAumentoTotal.toFixed(1)}%</p>
                                <p className="text-xs text-slate-600">Categoría con más aumentos:</p>
                                <p className="text-xs font-semibold text-slate-800 underline decoration-indigo-400 capitalize">{item.categoriaMayorAumento?.replace('_', ' ')}</p>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="mt-2 text-xs text-slate-400 leading-relaxed italic">
                            Evaluando variaciones históricas mensuales...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COMPARATIVE ALERTS FROM IA */}
                    {auditoria?.variacionPeriodos && auditoria.variacionPeriodos[0]?.alertasComparativas && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Alertas de Comparación Histórica:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {auditoria.variacionPeriodos[0].alertasComparativas.map((al, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex gap-3">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-slate-700 leading-normal">{al}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DEUDORES PANEL */}
                {activeSubTab === 'deudores' && (
                  <DeudoresPanel
                    liquidaciones={liquidaciones}
                    activeLiq={activeLiq}
                    onUpdateDeudores={handleUpdateDeudores}
                  />
                )}

                {/* 5. CABA LEGAL BASES PANEL */}
                {activeSubTab === 'normativa' && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6" id="panel-norma-caba">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900">Base Legal & Regulatoria Consorcial (CABA)</h3>
                      <p className="text-xs text-slate-500">Un compendio explicativo de las normativas vigentes en la Ciudad Autónoma de Buenos Aires aplicadas a expensas de consorcios.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 leading-relaxed text-xs">
                      <div className="p-5 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">1. Registro de Administradores (Ley 941 CABA)</h4>
                        <p className="text-slate-600">
                          Todos los administradores de consorcios en CABA deben estar registrados en el RPAC. La liquidación debe incluir obligatoriamente el código único de inscripción del administrador, CUIT del consorcio, y detalle específico y por separado de los gastos bancarios. Las expensas deben cobrarse exclusivamente en cuenta corriente bancaria a nombre del Consorcio.
                        </p>
                      </div>

                      <div className="p-5 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">2. Seguridad de Fachadas y Balcones (Ley 257)</h4>
                        <p className="text-slate-600">
                          Se expide una certificación periódica para verificar el estado de revoques, balcones y salientes. Los contratistas y arquitectos que la realicen deben emitir factura B/C correspondiente. Si se cobra como "Estudio técnico" sin habilitar profesionales en CABA, es motivo de observación grave.
                        </p>
                      </div>

                      <div className="p-5 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">3. El Gasto del Personal (SUTERH Paritarias)</h4>
                        <p className="text-slate-600">
                          El sueldo de los trabajadores de consorcio (portería, suplentes) rige bajo los convenios paritarios de FATERYH/SUTERH. Corresponde comprobar aportes tributarios (formulario F931 de AFIP) así como el seguro integral de vida obligatorio de la Caja de Protección Social de Suterh. Las irregularidades aquí pueden generar deudas millonarias e insolvencia.
                        </p>
                      </div>

                      <div className="p-5 border border-slate-100 rounded-2xl space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">4. Asambleas y Gastos Extraordinarios</h4>
                        <p className="text-slate-600">
                          Las expensas extraordinarias (por mejoras o imprevistos de gran estructura) deben estar aprobadas expresamente en Asamblea de Copropietarios por mayoría calificada. No es legal que las administraciones imputen gastos de pintura de pasillos o reparaciones generales de un departamento como "gastos varios ordinarios" bajo el velo mensual común.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-[11px] leading-relaxed">
                      💡 El presente software analiza la coherencia con respecto a estos 4 marcos reguladores argentinos, asistiendo a asambleas de copropietarios e inquilinos que deseen impugnar administraciones abusivas o carentes de transparencia.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL (SPAN 1): INTERACTIVE CHAT EXPERT ASSISTANT SIDE PANEL */}
            <div className="lg:col-span-1" id="chat-side-panel">
              <div className="sticky top-24 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col h-[580px] overflow-hidden">
                
                {/* Panel Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Asistente IA</h3>
                      <h4 className="text-sm font-black text-white">Auditor Interactivo</h4>
                    </div>
                  </div>
                  
                  {activeLiq && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase font-bold">
                      {activeLiq.periodo}
                    </span>
                  )}
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50" id="chat-scroller-box">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-500">¿Tenés dudas sobre los números extraídos o algún proveedor?</p>
                      <p className="text-[10px] text-slate-400 mt-1">Cargá una liquidación o el Demo para iniciar la asesoría automatizada.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-slate-800 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <div className="prose prose-xs max-w-none">
                            {/* Simple Markdown-Like line breaks & bold text rendering */}
                            {msg.text.split('\n').map((line, idx) => {
                              // Render code blocks or lists simply
                              if (line.startsWith('* ')) {
                                return (
                                  <li key={idx} className="list-disc list-inside text-[11px] text-slate-600 mt-0.5">
                                    {line.replace('* ', '')}
                                  </li>
                                );
                              }
                              
                              // Check bold blocks e.g. **Title**
                              const formattedText = line.split('**').map((part, pIdx) => {
                                if (pIdx % 2 === 1) {
                                  return (
                                    <strong key={pIdx} className="font-extrabold text-slate-900 block sm:inline">
                                      {part}
                                    </strong>
                                  );
                                }
                                return part;
                              });

                              return (
                                <p key={idx} className="mb-1 text-[11px] leading-relaxed">
                                  {formattedText}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-mono">{msg.timestamp}</span>
                      </div>
                    ))
                  )}

                  {isChatPending && (
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        <span className="text-[10px] text-slate-400 font-medium font-sans">El auditor está repasando los egresos...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={activeLiq ? "¿Por qué aumentó tanto el gas?" : "Subí liquidación para preguntar..."}
                    disabled={!activeLiq || isChatPending}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-slate-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!activeLiq || !chatInput.trim() || isChatPending}
                    className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}
      </main>
      
      {/* PROFESSIONAL FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-400 print:hidden mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Auditoría Novas CABA • Hecho para el empoderamiento e intermediación de inquilinos y copropietarios de CABA.</p>
          <p className="mt-1 text-[11px]">Ley Nacional 13.512 & Código Civil y Comercial de la Nación Argentina.</p>
        </div>
      </footer>
    </div>
  );
}
