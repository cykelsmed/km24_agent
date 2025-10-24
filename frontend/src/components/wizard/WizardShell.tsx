import React from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { Step1Goal } from './Step1Goal';
import { Step2Strategy } from './Step2Strategy';
import { Step3Builder } from './Step3Builder';
import { Step4Guide } from './Step4Guide';
import { Loader2 } from 'lucide-react';

export function WizardShell() {
  const { currentStep, isLoading, error } = useWizardStore();

  const steps = [
    { number: 1, label: 'Mål' },
    { number: 2, label: 'Strategi' },
    { number: 3, label: 'Builder' },
    { number: 4, label: 'Guide' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">KM24 Agent</h1>
          <p className="text-sm text-gray-600">Wizard for monitoring strategier</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.number
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.number
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep === step.number ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Fejl</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Genererer strategier...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {currentStep === 1 && <Step1Goal />}
            {currentStep === 2 && <Step2Strategy />}
            {currentStep === 3 && <Step3Builder />}
            {currentStep === 4 && <Step4Guide />}
          </>
        )}
      </main>
    </div>
  );
}
