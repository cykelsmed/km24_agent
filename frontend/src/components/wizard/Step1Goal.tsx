import React, { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { generateMonitoringRecipe } from '../../services/km24-api';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

const EXAMPLE_GOALS = [
  'Jeg vil overvåge nye byggesager i København',
  'Jeg vil følge med i påbud fra Arbejdstilsynet i byggebranchen',
  'Jeg vil have besked når virksomheder i transportbranchen går konkurs',
];

export function Step1Goal() {
  const { goal, setGoal, setRecipe, nextStep, setLoading, setError } = useWizardStore();
  const [localGoal, setLocalGoal] = useState(goal);

  const handleSubmit = async () => {
    if (!localGoal.trim()) return;

    setGoal(localGoal);
    setLoading(true);
    setError(null);

    try {
      const recipe = await generateMonitoringRecipe(localGoal);
      setRecipe(recipe);
      nextStep();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Fejl ved generering af strategier');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip directly to Step 3 (Builder) without AI suggestions
    if (localGoal.trim()) {
      setGoal(localGoal);
    }
    // TODO: Navigate to Step 3
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Hvad vil du overvåge?
        </h1>
        <p className="text-gray-600">
          Beskriv dit journalistiske mål, så genererer vi de bedste overvågningsstrategier til dig
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <Textarea
          value={localGoal}
          onChange={(e) => setLocalGoal(e.target.value)}
          placeholder="Eksempel: Jeg vil overvåge nye byggesager i København over 10 millioner kroner..."
          rows={5}
          className="text-lg"
        />

        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!localGoal.trim()}
            className="flex-1"
            size="lg"
          >
            Generer strategier
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            disabled={!localGoal.trim()}
            size="lg"
          >
            Spring over
          </Button>
        </div>
      </div>

      {/* Example goals */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Eller prøv et eksempel:</p>
        {EXAMPLE_GOALS.map((example, index) => (
          <button
            key={index}
            onClick={() => setLocalGoal(example)}
            className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <p className="text-sm text-gray-700">{example}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
