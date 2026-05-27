import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');
  return new GoogleGenAI({ apiKey });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const { liquidaciones } = req.body;
    if (!liquidaciones || !Array.isArray(liquidaciones) || liquidaciones.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar al menos una liquidación.' });
    }

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: `Eres un auditor experto en expensas de CABA. Auditá estas liquidaciones y devuelve JSON con: scoreTransparencia (0-100), scoreRiesgoAdministrativo (0-100), scoreSaludFinanciera (0-100), alertas (array con titulo, descripcion, tipo: danger/warning/success, categoria, sugerenciaAccion), resumenEjecutivo, observacionesDetalladas, conclusionesNormasCABA, variacionPeriodos. Datos: ${JSON.stringify(liquidaciones)}` }],
