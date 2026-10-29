'use client';

import { useState } from 'react';

const PAISES = ["Chile", "Perú", "México"];
const PRODUCTOS = [
  "AZDTE Chile (AZDTE)",
  "AZRecepción Chile",
  "Mixto (AZDTE/AZR Chile)",
  "AZDTE Chile (RADC)",
  "AZDTE Perú (ADP)",
  "AZDTE Perú (DTP)",
  "AZRecepción Perú",
  "Mixto (AZDTE/AZR Perú)",
  "Bolsa de Horas"
];
const MODALIDADES = ["No Aplica", "INHouse", "Cloud Dedicado", "Cloud"];
const GESTORES = [
  "Cristian Bustamante",
  "Daniel Bossio",
  "Juan Pablo Valdes",
  "Mario Casteletti",
  "Robinson Asencio"
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    crmId: '',
    pais: '',
    producto: '',
    modalidad: '',
    cliente: '',
    gestor: ''
  });
  const [status, setStatus] = useState({ loading: false, message: '', isError: false });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (
      !formData.crmId ||
      !formData.pais ||
      !formData.producto ||
      !formData.modalidad ||
      !formData.cliente ||
      !formData.gestor
    ) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (!file) {
      alert("Por favor selecciona tu archivo Excel (.xlsx)");
      return;
    }

    setStatus({ loading: true, message: 'Procesando archivo e importando a Notion...', isError: false });

    const data = new FormData();
    data.append('file', file);
    data.append('crmId', formData.crmId);
    data.append('pais', formData.pais);
    data.append('producto', formData.producto);
    data.append('modalidad', formData.modalidad);
    data.append('cliente', formData.cliente);
    data.append('gestor', formData.gestor);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (res.ok) {
        setStatus({ loading: false, message: `✅ Éxito: ${result.message}`, isError: false });
      } else {
        setStatus({ loading: false, message: `❌ Error: ${result.error}`, isError: true });
      }
    } catch (err) {
      setStatus({ loading: false, message: '❌ Error de red conectando con el servidor.', isError: true });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Importador a Notion</h1>
          <p className="text-sm text-gray-500">Sube tu archivo Excel de proyecto y asócialo al CRM.</p>
        </div>

        <div className="space-y-5">
          {/* CRM ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre y Número de CRM (ID)</label>
            <input 
              type="text" 
              name="crmId" 
              placeholder="Ej: CRM 18538" 
              value={formData.crmId}
              onChange={handleInputChange} 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Cliente y Gestor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
              <input 
                type="text" 
                name="cliente" 
                placeholder="Nombre del cliente"
                value={formData.cliente}
                onChange={handleInputChange} 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gestor</label>
              <select 
                name="gestor" 
                value={formData.gestor} 
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
              >
                <option value="">Selecciona un gestor</option>
                {GESTORES.map((gestor) => (
                  <option key={gestor} value={gestor}>{gestor}</option>
                ))}
              </select>
            </div>
          </div>

          {/* País y Modalidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">País</label>
              <select 
                name="pais" 
                value={formData.pais} 
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
              >
                <option value="">Selecciona un país</option>
                {PAISES.map((pais) => (
                  <option key={pais} value={pais}>{pais}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Modalidad</label>
              <select 
                name="modalidad" 
                value={formData.modalidad} 
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
              >
                <option value="">Selecciona modalidad</option>
                {MODALIDADES.map((modalidad) => (
                  <option key={modalidad} value={modalidad}>{modalidad}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Producto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Producto</label>
            <select 
              name="producto" 
              value={formData.producto} 
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
            >
              <option value="">Selecciona un producto</option>
              {PRODUCTOS.map((prod) => (
                <option key={prod} value={prod}>{prod}</option>
              ))}
            </select>
          </div>

          {/* Selector de Archivo */}
          <div className="pt-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Archivo de Tareas (.xlsx)</label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-4 pb-4">
                <svg className="w-7 h-7 mb-2 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="text-xs text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra el archivo</p>
                <p className="text-xs text-blue-600 font-medium truncate max-w-xs mt-1">{file ? file.name : "Ningún archivo seleccionado"}</p>
              </div>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={status.loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:bg-blue-300 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {status.loading ? "Procesando..." : "Ejecutar Importación"}
          </button>
        </div>

        {status.message && (
          <div className={`mt-5 p-4 rounded-lg text-sm font-medium ${status.isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            {status.message}
          </div>
        )}
      </div>
    </main>
  );
}