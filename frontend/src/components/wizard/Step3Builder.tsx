import React, { useState, useEffect } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { validateMonitoringFilters } from '../../services/km24-api';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import type { ValidationResult } from '../../types/km24';

interface ModuleCardProps {
  module: {
    module_id: number;
    module_name: string;
    filters: Record<string, any>;
    pedagogical_tip?: string;
  };
  onFilterChange: (moduleId: number, filters: Record<string, any>) => void;
}

function ModuleCard({ module, onFilterChange }: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showAllHits, setShowAllHits] = useState(false);

  // Debounce validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validateFilters();
    }, 500);

    return () => clearTimeout(timer);
  }, [module.filters]);

  const validateFilters = async () => {
    if (!module.filters || Object.keys(module.filters).length === 0) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateMonitoringFilters(module.module_id, module.filters);
      setValidation(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = {
      ...module.filters,
      [filterName]: value || undefined,
    };
    // Remove empty filters
    Object.keys(newFilters).forEach(key => {
      if (!newFilters[key]) delete newFilters[key];
    });
    onFilterChange(module.module_id, newFilters);
  };

  const hitCount = validation?.hit_count ?? 0;
  const hasWarnings = validation?.warnings && validation.warnings.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          <h3 className="font-semibold text-gray-900">{module.module_name}</h3>
          {validation && (
            <span className={`text-sm font-medium ${
              hitCount === 0 ? 'text-red-600' :
              hitCount > 100 ? 'text-amber-600' :
              'text-green-600'
            }`}>
              {isValidating ? '...' : `${hitCount} hits`}
            </span>
          )}
        </div>
        {validation && (
          hitCount === 0 ?
            <AlertCircle size={20} className="text-red-600" /> :
            <CheckCircle size={20} className="text-green-600" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kommune
              </label>
              <input
                type="text"
                value={module.filters.kommune || ''}
                onChange={(e) => handleFilterChange('kommune', e.target.value)}
                placeholder="F.eks. København"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branche
              </label>
              <input
                type="text"
                value={module.filters.branche || ''}
                onChange={(e) => handleFilterChange('branche', e.target.value)}
                placeholder="F.eks. Byggeri"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Søgeord
              </label>
              <input
                type="text"
                value={module.filters.soegeord || module.filters.søgeord || ''}
                onChange={(e) => handleFilterChange('soegeord', e.target.value)}
                placeholder="F.eks. transport"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pedagogical tip */}
          {module.pedagogical_tip && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-blue-900">{module.pedagogical_tip}</p>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-900 mb-1">Advarsler:</p>
              <ul className="text-sm text-amber-800 space-y-1">
                {validation.warnings?.map((warning, idx) => (
                  <li key={idx}>⚠️ {warning}</li>
                ))}
              </ul>
              {validation.suggestions && validation.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-amber-900 mb-1">Forslag:</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {validation.suggestions.map((suggestion, idx) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Sample hits preview */}
          {validation && validation.sample_hits.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Preview (3 seneste hits):</h4>
              <div className="space-y-2">
                {validation.sample_hits.slice(0, 3).map((hit, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium text-gray-900">{hit.title}</p>
                    {hit.date && (
                      <p className="text-gray-600 text-xs mt-1">{hit.date}</p>
                    )}
                    {hit.summary && (
                      <p className="text-gray-700 mt-1">{hit.summary}</p>
                    )}
                  </div>
                ))}
              </div>

              {hitCount > 3 && (
                <button
                  onClick={() => setShowAllHits(true)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Vis alle {hitCount} hits →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Step3Builder() {
  const { customModules, updateModule, nextStep, previousStep } = useWizardStore();

  const totalHits = customModules.length * 12; // Placeholder estimate

  if (!customModules || customModules.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ingen moduler valgt. Gå tilbage og vælg en strategi.</p>
        <Button onClick={previousStep} className="mt-4">
          ← Tilbage
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Finjuster din overvågning
        </h1>
        <p className="text-gray-600">
          Tilpas filtre for hvert modul og se live preview af hits
        </p>
      </div>

      {/* Module cards */}
      <div className="space-y-4 mb-8">
        {customModules.map((module) => (
          <ModuleCard
            key={module.module_id}
            module={module}
            onFilterChange={updateModule}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Samlet estimat</h3>
            <p className="text-gray-700">
              Ca. <span className="font-bold text-blue-600">{totalHits} hits/dag</span> med den nuværende konfiguration
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button onClick={previousStep} variant="outline" size="lg">
          ← Tilbage
        </Button>
        <Button onClick={nextStep} className="flex-1" size="lg">
          Næste: Se implementeringsguide →
        </Button>
      </div>
    </div>
  );
}
