/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GastoItem {
  id: string; // Generated on extraction or client
  categoria: 'sueldos_cargas' | 'mantenimiento' | 'servicios' | 'honorarios_administracion' | 'seguros' | 'gastos_bancarios' | 'otros';
  concepto: string;
  proveedor: string;
  monto: number;
  comprobante: string;
  esExtraordinario: boolean;
}

export interface FondosEstadisticas {
  fondoReservaActivo: number;
  aporteFondoReserva: number;
}

export interface MorososEstadisticas {
  totalMorosos: number;
  cantidadMorosos: number;
  porcentajeMorosidad: number;
}

export interface Debedor {
  id: string;
  unidad: string;
  nombre: string;
  deuda: number;
  mesesAdeudados: number;
  interes: number;
  estado: 'grave' | 'alerta' | 'leve' | 'judicial';
}

export interface LiquidacionData {
  id: string; // Internal unique ID
  fileName: string;
  nombreConsorcio: string;
  direccion: string;
  cuit: string;
  administrador: string;
  periodo: string; // e.g., "Octubre 2025"
  totalGastos: number;
  gastos: GastoItem[];
  fondos?: FondosEstadisticas;
  morosos?: MorososEstadisticas;
  deudores?: Debedor[];
}

export interface AlertaAuditoria {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'danger' | 'warning' | 'success'; // maps to red, yellow/amber, green
  categoria: string; // 'Sueldos', 'Mantenimiento', 'CABA Legal', 'Contabilidad', 'Fondos'
  montoAsociado?: number;
  gastoReferencia?: string;
  sugerenciaAccion: string;
}

export interface InformeAuditoria {
  scoreTransparencia: number; // 0-100
  scoreRiesgoAdministrativo: number; // 0-100
  scoreSaludFinanciera: number; // 0-100
  alertas: AlertaAuditoria[];
  resumenEjecutivo: string;
  observacionesDetalladas: string;
  conclusionesNormasCABA: string;
  variacionPeriodos?: {
    periodoAnterior: string;
    periodoActual: string;
    porcentajeAumentoTotal: number;
    categoriaMayorAumento: string;
    alertasComparativas: string[];
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
