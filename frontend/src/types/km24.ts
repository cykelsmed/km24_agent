/**
 * TypeScript type definitions for KM24 Agent
 */

export interface Module {
  module_id: number;
  module_name: string;
  filters: Record<string, any>;
  pedagogical_tip?: string;
}

export interface Strategy {
  name: string;
  description: string;
  estimated_hits_per_day: number;
  modules: Module[];
  recommended: boolean;
}

export interface MonitoringRecipe {
  goal: string;
  strategies: Strategy[];
  assessment: string;
}

export interface Hit {
  title: string;
  date?: string;
  summary?: string;
  url?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  sample_hits: Hit[];
  hit_count: number;
  warnings?: string[];
  suggestions?: string[];
}

export interface KM24Module {
  id: number;
  title: string;
  emoji: string;
  description?: string;
}

// Wizard state
export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardState {
  currentStep: WizardStep;
  goal: string;
  selectedStrategy: Strategy | null;
  customModules: Module[];
  recipe: MonitoringRecipe | null;
}
