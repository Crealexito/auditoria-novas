/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, Sparkles, Loader2, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { LiquidacionData } from '../types';
import { DEMO_LIQUIDACIONES } from './MockGenerator';

interface UploadZoneProps {
  onParsed: (data: LiquidacionData) => void;
  onLoadDemos: (demos: LiquidacionData[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function UploadZone({ onParsed, onLoadDemos, isLoading, setIsLoading }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Check valid type
    const validMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validMimeTypes.includes(file.type)) {
      setErrorMsg('Formato de archivo inválido. Por favor, subí PDF, JPG o PNG de la liquidación.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setCurrentFileName(file.name);

    try {
      // Read file into base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const resultString = reader.result as string;
        // Strip out metadata header from data URL if needed
        const base64Data = resultString.split(',')[1];

        // Send to OCR & structured parsing endpoint
        const response = await fetch('/api/audit/parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type,
            base64: base64Data,
          }),
        });

        if (!response.ok) {
          const errRes = await response.json();
          throw new Error(errRes.error || 'Error al intentar parsear el documento recibido.');
        }

        const data: Omit<LiquidacionData, 'id' | 'fileName'> = await response.json();
        
        // Finalize Liquidacion object structure
        const parsedLiquidacion: LiquidacionData = {
          ...data,
          id: `liq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fileName: file.name,
        };

        onParsed(parsedLiquidacion);
      };
      reader.onerror = () => {
        throw new Error('Error de lectura física de archivo en el navegador.');
      };
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Error desconocido al analizar tu liquidación. Intentá nuevamente.');
    } finally {
      setIsLoading(false);
      setCurrentFileName(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        id="uploader-main-box"
      >
        <div className="flex flex-col items-center text-center justify-center">
          {isLoading ? (
            <div className="py-6 flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="text-emerald-600 mb-4"
              >
                <Loader2 className="w-12 h-12 stroke-[1.5]" />
              </motion.div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                Procesando liquidación con IA...
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                Leyendo archivo <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{currentFileName}</span> mediante OCR inteligente. Estructurando liquidación, extrayendo proveedores, morosos y categorías contables de CABA.
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-white shadow-sm rounded-full border border-slate-100 flex items-center justify-center text-slate-600 mb-4">
                <Upload className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                Cargá las liquidaciones de expensas
              </h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                Arrastrá tus archivos <span className="font-semibold text-slate-700">PDF, JPG o PNG</span> o hacé clic para explorar tus carpetas locales. Podés cargar un período o varios para compararlos.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                <button
                  type="button"
                  id="browse-files-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-slate-950 text-white rounded-xl font-medium text-sm hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Elegir Archivo
                </button>

                <button
                  type="button"
                  id="load-demos-btn"
                  onClick={() => onLoadDemos(DEMO_LIQUIDACIONES)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  Cargar Consorcio Demo (Belgrano, CABA)
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileInputChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                id="file-input-field"
              />
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3"
          id="upload-error-box"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-900">Error de procesamiento</h4>
            <p className="text-xs text-rose-700">{errorMsg}</p>
          </div>
        </motion.div>
      )}

      <div className="mt-4 flex items-center gap-2 justify-center text-xs text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
        <span>Impulsado por Gemini 3.5 Flash: Especialista en Administración de Consorcios bajo reglamentación Ley 941 de CABA.</span>
      </div>
    </div>
  );
}
