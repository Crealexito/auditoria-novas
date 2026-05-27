/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LiquidacionData } from '../types';

export const DEMO_LIQUIDACIONES: LiquidacionData[] = [
  {
    id: 'demo-abril-2026',
    fileName: 'liquidacion_arcos_abril_2026.pdf',
    nombreConsorcio: 'Consorcio Arcos 2300',
    direccion: 'Arcos 2345, Belgrano, CABA',
    cuit: '30-71458932-5',
    administrador: 'Administración GESTIÓN DE EXPENSAS S.A.',
    periodo: 'Abril 2026',
    totalGastos: 1530000,
    gastos: [
      {
        id: 'da1',
        categoria: 'sueldos_cargas',
        concepto: 'Sueldos Encargado Permanente con aportes (Gomez Jose)',
        proveedor: 'Encargados Suterh',
        monto: 680000,
        comprobante: 'Recibo Nro 2144',
        esExtraordinario: false,
      },
      {
        id: 'da2',
        categoria: 'sueldos_cargas',
        concepto: 'F931 AFIP Cargas Sociales Obligatorias',
        proveedor: 'AFIP Seguridades',
        monto: 240000,
        comprobante: 'Transf. Ticket #9912',
        esExtraordinario: false,
      },
      {
        id: 'da3',
        categoria: 'mantenimiento',
        concepto: 'Abono Mensual de Conservación de Ascensores',
        proveedor: 'Ascensores Express SRL',
        monto: 110000,
        comprobante: 'Factura B-2114',
        esExtraordinario: false,
      },
      {
        id: 'da4',
        categoria: 'mantenimiento',
        concepto: 'Matafuegos Recargas Obligatorias y Tarjeta CABA',
        proveedor: 'Fuego Seguro CABA',
        monto: 65000,
        comprobante: 'Factura B-00912',
        esExtraordinario: false,
      },
      {
        id: 'da5',
        categoria: 'servicios',
        concepto: 'Consumo Eléctrico Luz Común Escaleras y Bombas',
        proveedor: 'Edesur S.A.',
        monto: 135000,
        comprobante: 'Factura Fact-45129',
        esExtraordinario: false,
      },
      {
        id: 'da6',
        categoria: 'servicios',
        concepto: 'Abono Agua Común Consorcio Bimestre 2',
        proveedor: 'AySA S.A.',
        monto: 78000,
        comprobante: 'Clave Pago 412499',
        esExtraordinario: false,
      },
      {
        id: 'da7',
        categoria: 'honorarios_administracion',
        concepto: 'Honorarios Liquidadores Administración Mensual',
        proveedor: 'Administración GESTIÓN EXPENSAS',
        monto: 120000,
        comprobante: 'Factura C-0021-002',
        esExtraordinario: false,
      },
      {
        id: 'da8',
        categoria: 'seguros',
        concepto: 'Seguro Integral de Consorcio y Responsabilidad Civil',
        proveedor: 'La Segunda Seguros',
        monto: 85000,
        comprobante: 'Póliza 451299-A',
        esExtraordinario: false,
      },
      {
        id: 'da9',
        categoria: 'gastos_bancarios',
        concepto: 'Comisiones Cuenta Corriente y Transferencias',
        proveedor: 'Banco Ciudad de Buenos Aires',
        monto: 22000,
        comprobante: 'Resumen Cuenta 124/2',
        esExtraordinario: false,
      },
    ],
    fondos: {
      fondoReservaActivo: 850000,
      aporteFondoReserva: 100000,
    },
    morosos: {
      totalMorosos: 245000,
      cantidadMorosos: 3,
      porcentajeMorosidad: 16,
    },
    deudores: [
      { id: 'd1', unidad: 'Piso 2 A', nombre: 'Carlos Rodríguez', deuda: 120000, mesesAdeudados: 3, interes: 18000, estado: 'grave' },
      { id: 'd2', unidad: 'Piso 4 B', nombre: 'Marta Giménez', deuda: 85000, mesesAdeudados: 2, interes: 8500, estado: 'alerta' },
      { id: 'd3', unidad: 'Piso 8 C', nombre: 'Juan Pérez', deuda: 40000, mesesAdeudados: 1, interes: 2000, estado: 'leve' },
    ],
  },
  {
    id: 'demo-mayo-2026',
    fileName: 'liquidacion_arcos_mayo_2026.pdf',
    nombreConsorcio: 'Consorcio Arcos 2300',
    direccion: 'Arcos 2345, Belgrano, CABA',
    cuit: '30-71458932-5',
    administrador: 'Administración GESTIÓN DE EXPENSAS S.A.',
    periodo: 'Mayo 2026',
    totalGastos: 2280000, // Elevated by a massive duplicate plumber fee, administrative rise, and fake extra charge!
    gastos: [
      {
        id: 'dm1',
        categoria: 'sueldos_cargas',
        concepto: 'Sueldos Encargado Permanente con aportes (Gomez Jose)',
        proveedor: 'Encargados Suterh',
        monto: 890000, // Raised significantly
        comprobante: 'Recibo Nro 2235',
        esExtraordinario: false,
      },
      {
        id: 'dm2',
        categoria: 'sueldos_cargas',
        concepto: 'F931 AFIP Cargas Sociales Obligatorias',
        proveedor: 'AFIP Seguridades',
        monto: 290000,
        comprobante: 'Transf. Ticket #10214',
        esExtraordinario: false,
      },
      {
        id: 'dm3',
        categoria: 'mantenimiento',
        concepto: 'Abono Mensual de Conservación de Ascensores',
        proveedor: 'Ascensores Express SRL',
        monto: 110000,
        comprobante: 'Sin Comprobante', // Anomaly! Missing invoice number or SC!
        esExtraordinario: false,
      },
      {
        id: 'dm4',
        categoria: 'mantenimiento',
        concepto: 'Reparación de filtración baño de portería',
        proveedor: 'Plomería Total de Arcos',
        monto: 180000,
        comprobante: 'Factura Interna #092', // Double charging or suspicious interior voucher
        esExtraordinario: false,
      },
      {
        id: 'dm5',
        categoria: 'mantenimiento',
        concepto: 'Trabajo plomería urgente filtraciones de caño maestra',
        proveedor: 'Plomería Total de Arcos',
        monto: 180000, // Duplicated/highly suspiciously similar plumbing charge!
        comprobante: 'Factura Interna #093',
        esExtraordinario: false,
      },
      {
        id: 'dm6',
        categoria: 'servicios',
        concepto: 'Consumo Eléctrico Luz Común Escaleras y Bombas',
        proveedor: 'Edesur S.A.',
        monto: 245000, // Huge increase!
        comprobante: 'Factura Fact-46912',
        esExtraordinario: false,
      },
      {
        id: 'dm7',
        categoria: 'servicios',
        concepto: 'Abono Agua Común Consorcio Bimestre 2',
        proveedor: 'AySA S.A.',
        monto: 78000,
        comprobante: 'Clave Pago 412499',
        esExtraordinario: false,
      },
      {
        id: 'dm8',
        categoria: 'honorarios_administracion',
        concepto: 'Honorarios Liquidadores Administración Mensual',
        proveedor: 'Administración GESTIÓN EXPENSAS',
        monto: 160000, // Administration fee rose 33% without assembly!
        comprobante: 'Factura C-0021-003',
        esExtraordinario: false,
      },
      {
        id: 'dm9',
        categoria: 'seguros',
        concepto: 'Seguro Integral de Consorcio y Responsabilidad Civil',
        proveedor: 'La Segunda Seguros',
        monto: 85000,
        comprobante: 'Póliza 451299-A',
        esExtraordinario: false,
      },
      {
        id: 'dm10',
        categoria: 'gastos_bancarios',
        concepto: 'Comisiones de Cuenta Corriente y Tasas',
        proveedor: 'Banco Ciudad de Buenos Aires',
        monto: 24000,
        comprobante: 'Resumen Cuenta 125/2',
        esExtraordinario: false,
      },
      {
        id: 'dm11',
        categoria: 'otros',
        concepto: 'Gastos Varios de Oficina y Mensajería',
        proveedor: 'Administración GESTIÓN EXPENSAS',
        monto: 38000, // Anomaly! High office materials / ambiguous expense without proof!
        comprobante: 'Sin Comprobante',
        esExtraordinario: false,
      },
    ],
    fondos: {
      fondoReservaActivo: 650000, // Drained reserves without clear reason!
      aporteFondoReserva: 100000,
    },
    morosos: {
      totalMorosos: 390000, // Delinquency rates spiked!
      cantidadMorosos: 5,
      porcentajeMorosidad: 25,
    },
    deudores: [
      { id: 'd1', unidad: 'Piso 2 A', nombre: 'Carlos Rodríguez', deuda: 160000, mesesAdeudados: 4, interes: 32000, estado: 'judicial' },
      { id: 'd2', unidad: 'Piso 4 B', nombre: 'Marta Giménez', deuda: 125000, mesesAdeudados: 3, interes: 18750, estado: 'grave' },
      { id: 'd3', unidad: 'Piso 8 C', nombre: 'Juan Pérez', deuda: 0, mesesAdeudados: 0, interes: 0, estado: 'leve' },
      { id: 'd4', unidad: 'Piso 5 A', nombre: 'Lucía Fernández', deuda: 45000, mesesAdeudados: 1, interes: 2250, estado: 'leve' },
      { id: 'd5', unidad: 'Piso 1 B', nombre: 'Roberto Gómez', deuda: 60000, mesesAdeudados: 1, interes: 3000, estado: 'alerta' },
    ],
  },
];
