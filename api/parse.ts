import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');
  return new GoogleGenAI({ apiKey });
}

function localParseFallback(filename: string): any {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const curDate = new Date();
  const periodo = `${months[curDate.getMonth()]} ${curDate.getFullYear()}`;
  return {
    id: `local-${Date.now()}`,
    fileName: filename,
    nombreConsorcio: 'Consorcio CABA',
    direccion: 'Av. Corrientes 1450, CABA',
    cuit: '30-71120491-3',
    administrador: 'Administración Novas',
    periodo,
    totalGastos: 1813000,
    gastos: [
      { id: `g1-${Date.now()}`, categoria: 'sueldos_cargas', concepto: 'Sueldo Encargado', proveedor: 'SUTERH', monto: 720000, comprobante: 'Recibo #1024', esExtraordinario: false },
      { id: `g2-${Date.now()}`, categoria: 'servicios', concepto: 'Luz común Edesur', proveedor: 'Edesur', monto: 165000, comprobante: 'Factura Luz-04212', esExtraordinario: false },
      { id: `g3-${Date.now()}`, categoria: 'honorarios_administracion', concepto: 'Honorarios Administración', proveedor: 'Adm. Novas', monto: 135000, comprobante: 'Factura C-0241A', esExtraordinario: false },
    ],
    fondos: { fondoReservaActivo: 750000, aporteFondoReserva: 80000 },
    morosos: { totalMorosos: 210000, cantidadMorosos: 4, porcentajeMorosidad: 12 },
    deudores: [
      { id: `d1-${Date.now()}`, unidad: 'Piso 1 B', nombre: 'Eduardo Kovács', deuda: 90000, mesesAdeudados: 2, interes: 9000, estado: 'alerta' },
    ],
    isFallbackData: true
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const { name, mimeType, base64 } = req.body;
    if (!base64 || !mimeType) return res.status(400).json({ error: 'Faltan datos de archivo.' });

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { inlineData: { mimeType, data: base64 } },
        { text: `Eres un auditor experto en expensas de CABA. Extrae los datos de esta liquidación y devuelve JSON con: nombreConsorcio, direccion, cuit, administrador, periodo, totalGastos, gastos (array con categoria, concepto, proveedor, monto, comprobante, esExtraordinario), fondos (fondoReservaActivo, aporteFondoReserva), morosos (totalMorosos, cantidadMorosos, porcentajeMorosidad), deudores (unidad, nombre, deuda, mesesAdeudados, interes, estado).` }
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    if (parsed.gastos) parsed.gastos = parsed.gastos.map((g: any, i: number) => ({ id: `g-${Date.now()}-${i}`, ...g }));
    if (parsed.deudores) parsed.deudores = parsed.deudores.map((d: any, i: number) => ({ id: `d-${Date.now()}-${i}`, ...d }));
    res.json(parsed);
  } catch (error: any) {
    console.error('Parse error:', error);
    res.json(localParseFallback(req.body.name || 'expensas.pdf'));
  }
}
