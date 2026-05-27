import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');
  return new GoogleGenAI({ apiKey });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const { messages, liquidaciones, auditoria } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Faltan los mensajes del chat.' });
    }

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: `Eres el Auditor de Expensas CABA. Ayudá al propietario a entender su liquidación. Datos del consorcio: ${JSON.stringify(liquidaciones)}. Auditoría: ${JSON.stringify(auditoria)}. Historial: ${JSON.stringify(messages.slice(-6))}. Respondé en Markdown, profesional y didáctico.` }],
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.json({ text: '### Asistente en modo local\nNo se pudo conectar con Gemini. Verificá la configuración de la API key en Vercel.' });
  }
}
