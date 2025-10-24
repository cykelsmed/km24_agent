/**
 * Wizard State Management with Zustand
 */

import { create } from 'zustand';
import type { WizardStep, Strategy, Module, MonitoringRecipe } from '../types/km24';

interface WizardStore {
  // State
  currentStep: WizardStep;
  goal: string;
  recipe: MonitoringRecipe | null;
  selectedStrategy: Strategy | null;
  customModules: Module[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  setGoal: (goal: string) => void;
  setRecipe: (recipe: MonitoringRecipe) => void;
  setSelectedStrategy: (strategy: Strategy) => void;
  updateModule: (moduleId: number, filters: Record<string, any>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1 as WizardStep,
  goal: '',
  recipe: null,
  selectedStrategy: null,
  customModules: [],
  isLoading: false,
  error: null,
};

export const useWizardStore = create<WizardStore>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const current = get().currentStep;
    if (current < 4) {
      set({ currentStep: (current + 1) as WizardStep });
    }
  },

  previousStep: () => {
    const current = get().currentStep;
    if (current > 1) {
      set({ currentStep: (current - 1) as WizardStep });
    }
  },

  setGoal: (goal) => set({ goal }),

  setRecipe: (recipe) => {
    set({ recipe });
    // Auto-select recommended strategy if present
    const recommended = recipe.strategies.find((s) => s.recommended);
    if (recommended) {
      set({ selectedStrategy: recommended });
    }
  },

  setSelectedStrategy: (strategy) => {
    set({
      selectedStrategy: strategy,
      customModules: JSON.parse(JSON.stringify(strategy.modules)), // Deep clone
    });
  },

  updateModule: (moduleId, filters) => {
    set((state) => ({
      customModules: state.customModules.map((module) =>
        module.module_id === moduleId
          ? { ...module, filters: { ...module.filters, ...filters } }
          : module
      ),
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
