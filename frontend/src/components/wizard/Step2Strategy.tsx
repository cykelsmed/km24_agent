import React from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { Button } from '../ui/Button';
import type { Strategy } from '../../types/km24';

export function Step2Strategy() {
  const { recipe, selectedStrategy, setSelectedStrategy, nextStep, previousStep } = useWizardStore();

  if (!recipe) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Ingen strategier tilgængelige</p>
      </div>
    );
  }

  const handleSelectStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
  };

  const handleNext = () => {
    if (selectedStrategy) {
      nextStep();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          3 strategier der kan virke
        </h1>
        <p className="text-gray-600">
          Vælg den strategi der passer bedst til dit mål
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {recipe.strategies.map((strategy, index) => (
          <button
            key={index}
            onClick={() => handleSelectStrategy(strategy)}
            className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
              selectedStrategy?.name === strategy.name
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {strategy.name}
              </h3>
              {strategy.recommended && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Anbefalet
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-4">{strategy.description}</p>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-medium">Estimat:</span> ~{strategy.estimated_hits_per_day} hits/dag
              </div>
              <div>
                <span className="font-medium">Moduler:</span> {strategy.modules.length}
              </div>
            </div>

            {/* Module list */}
            <div className="mt-4 space-y-2">
              {strategy.modules.map((module, mIndex) => (
                <div key={mIndex} className="text-sm bg-gray-50 px-3 py-2 rounded">
                  <span className="font-medium">{module.module_name}</span>
                  {Object.keys(module.filters).length > 0 && (
                    <span className="text-gray-600 ml-2">
                      ({Object.entries(module.filters).map(([k, v]) => `${k}: ${v}`).join(', ')})
                    </span>
                  )}
                </div>
              ))}
            </div>

            {strategy.modules.some(m => m.pedagogical_tip) && (
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <span>💡</span>
                <p>{strategy.modules.find(m => m.pedagogical_tip)?.pedagogical_tip}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Assessment */}
      {recipe.assessment && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Vurdering</h3>
          <p className="text-gray-700">{recipe.assessment}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button onClick={previousStep} variant="outline" size="lg">
          ← Tilbage
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedStrategy}
          className="flex-1"
          size="lg"
        >
          Næste →
        </Button>
      </div>
    </div>
  );
}
