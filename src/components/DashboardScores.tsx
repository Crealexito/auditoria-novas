/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { ShieldCheck, Scale, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardScoresProps {
  scoreTransparencia: number;
  scoreRiesgoAdministrativo: number;
  scoreSaludFinanciera: number;
}

export default function DashboardScores({
  scoreTransparencia,
  scoreRiesgoAdministrativo,
  scoreSaludFinanciera,
}: DashboardScoresProps) {
  
  // Helpers to get styles and labels
  const getTransparencyStyle = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Transparencia Excelente', text: 'Gran detalle de comprobantes, AFIP F931 completo y proveedores con CUIT.' };
    if (score >= 50) return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Transparencia Moderada', text: 'Se omiten detalles de facturas o comprobantes en algunos mantenimientos.' };
    return { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'Poca Transparencia', text: 'Conceptos altamente ambiguos como "Gastos Varios" y falta sistemática de comprobantes.' };
  };

  const getRiskStyle = (score: number) => {
    if (score >= 70) return { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'Riesgo Administrativo Alto', text: 'Doble facturación, posibles sobreprecios o aumentos inconsultos detectados.' };
    if (score >= 40) return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Riesgo Moderado', text: 'Se observan subas de precios superiores a inflación o proveedores informales.' };
    return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Riesgo Administrativo Bajo', text: 'Abonos regulares, facturación consistente y estricto cumplimiento legal.' };
  };

  const getFinancialStyle = (score: number) => {
    if (score >= 85) return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Excelente Salud Financiera', text: 'Morosidad baja, fondos de reserva activos y gastos previsibles/ordinarios.' };
    if (score >= 50) return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Presupuesto Ajustado', text: 'Morosidad en niveles elevados o un fondo de reserva escaso para contingencias.' };
    return { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'Riesgo Financiero / Déficit', text: 'Gran deuda de morosos, retiro del fondo de reserva para gastos corrientes ordinarios.' };
  };

  const trans = getTransparencyStyle(scoreTransparencia);
  const risk = getRiskStyle(scoreRiesgoAdministrativo);
  const fin = getFinancialStyle(scoreSaludFinanciera);

  // Radial configurations for SVG circles
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const renderGauge = (score: number, strokeColor: string, icon: ReactNode) => {
    const strokeDashoffset = circumference - (score / 100) * circumference;
    return (
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-slate-100 fill-none"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            className={`fill-none ${strokeColor}`}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon}
          <span className="text-xl font-mono font-bold text-slate-800 tracking-tight">{score}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="scores-grid-container">
      {/* Transparency Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-5 hover:border-slate-200 hover:shadow-md transition-all duration-300">
        <div className="shrink-0 flex justify-center w-full sm:w-auto">
          {renderGauge(
            scoreTransparencia,
            scoreTransparencia >= 80
              ? 'stroke-emerald-500'
              : scoreTransparencia >= 50
              ? 'stroke-amber-500'
              : 'stroke-rose-500',
            <ShieldCheck className="w-4 h-4 text-slate-400 -mb-1" />
          )}
        </div>
        <div className="flex-1">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${trans.color} mb-3`}>
            {trans.label}
          </span>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Transparencia Documental
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {trans.text}
          </p>
        </div>
      </div>

      {/* Administrative Risk Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-5 hover:border-slate-200 hover:shadow-md transition-all duration-300">
        <div className="shrink-0 flex justify-center w-full sm:w-auto">
          {renderGauge(
            scoreRiesgoAdministrativo,
            scoreRiesgoAdministrativo >= 70
              ? 'stroke-rose-500'
              : scoreRiesgoAdministrativo >= 40
              ? 'stroke-amber-500'
              : 'stroke-emerald-500',
            <Scale className="w-4 h-4 text-slate-400 -mb-1" />
          )}
        </div>
        <div className="flex-1">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${risk.color} mb-3`}>
            {risk.label}
          </span>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Riesgo Administrativo
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {risk.text}
          </p>
        </div>
      </div>

      {/* Financial Health Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-5 hover:border-slate-200 hover:shadow-md transition-all duration-300">
        <div className="shrink-0 flex justify-center w-full sm:w-auto">
          {renderGauge(
            scoreSaludFinanciera,
            scoreSaludFinanciera >= 85
              ? 'stroke-emerald-500'
              : scoreSaludFinanciera >= 50
              ? 'stroke-amber-500'
              : 'stroke-rose-500',
            <TrendingUp className="w-4 h-4 text-slate-400 -mb-1" />
          )}
        </div>
        <div className="flex-1">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${fin.color} mb-3`}>
            {fin.label}
          </span>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Salud Financiera
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {fin.text}
          </p>
        </div>
      </div>
    </div>
  );
}
