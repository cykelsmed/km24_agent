import React, { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { Button } from '../ui/Button';
import { Copy, Check, Download } from 'lucide-react';

export function Step4Guide() {
  const { goal, customModules, reset } = useWizardStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!customModules || customModules.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ingen konfiguration at vise.</p>
      </div>
    );
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateCurlCommand = (module: typeof customModules[0]) => {
    // Convert filters to parts format (simplified)
    const parts = Object.entries(module.filters)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({
        modulePartId: key === 'kommune' ? 2 : key === 'branche' ? 5 : 53,
        values: Array.isArray(value) ? value : [value]
      }));

    const payload = {
      name: `Overvågning: ${module.module_name}`,
      moduleId: module.module_id,
      lookbackDays: 30,
      parts: parts
    };

    return `curl -X POST https://km24.dk/api/steps/main \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
  };

  const handleDownloadPDF = () => {
    // This would generate a PDF in a real implementation
    alert('PDF download funktion kommer snart!');
  };

  const handleStartOver = () => {
    if (confirm('Er du sikker på at du vil starte forfra?')) {
      reset();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Implementeringsguide
        </h1>
        <p className="text-gray-600">
          Følg disse trin for at opsætte din overvågning i KM24
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left column: Manual steps */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Manuel opsætning
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Log ind på KM24</h3>
                <p className="text-sm text-gray-600">
                  Gå til <a href="https://km24.dk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">km24.dk</a> og log ind med dine credentials
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Hent din API-nøgle</h3>
                <p className="text-sm text-gray-600">
                  Gå til <a href="https://km24.dk/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">km24.dk/tokens</a> og opret en ny API token
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Opret overvågninger</h3>
                <p className="text-sm text-gray-600">
                  Brug curl-kommandoerne til højre for at oprette dine {customModules.length} overvågninger
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Verificer hits</h3>
                <p className="text-sm text-gray-600">
                  Tjek dine overvågninger i KM24-interfacet og juster filtre hvis nødvendigt
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                ✓
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Klar!</h3>
                <p className="text-sm text-gray-600">
                  Din overvågning kører nu automatisk. Du modtager notifikationer når nye hits findes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: API commands */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              💻 API-kommandoer
            </h2>

            <div className="space-y-6">
              {customModules.map((module, index) => (
                <div key={module.module_id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {index + 1}. {module.module_name}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(generateCurlCommand(module), index)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check size={16} />
                          Kopieret!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Kopier
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{generateCurlCommand(module)}</code>
                  </pre>

                  {Object.keys(module.filters).length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Filtre: {Object.entries(module.filters)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary box */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">
          Din overvågningsstrategi
        </h3>
        <p className="text-gray-700 mb-2">
          <strong>Mål:</strong> {goal}
        </p>
        <p className="text-gray-700">
          <strong>Moduler:</strong> {customModules.map(m => m.module_name).join(', ')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleDownloadPDF} variant="outline" size="lg">
          <Download size={20} className="mr-2" />
          Download PDF
        </Button>
        <Button onClick={handleStartOver} variant="secondary" size="lg" className="flex-1">
          Start forfra
        </Button>
      </div>

      {/* Additional resources */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📚 Nyttige links</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <a href="https://km24.dk/api/docs/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              → KM24 API Dokumentation
            </a>
          </li>
          <li>
            <a href="https://km24.dk/tokens" target="_blank" rel="noopener noreferrer" className="hover:underline">
              → API Token Management
            </a>
          </li>
          <li>
            <a href="https://km24.dk/modules/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              → Browse alle KM24 moduler
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
