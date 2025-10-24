/**
 * KM24 Agent API Client
 *
 * Service layer for communicating with the backend API
 */

import type { MonitoringRecipe, ValidationResult, Hit, KM24Module } from '../types/km24';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

class KM24APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'KM24APIError';
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new KM24APIError(
        error.detail || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof KM24APIError) {
      throw error;
    }
    throw new KM24APIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate monitoring recipe based on a goal
 */
export async function generateMonitoringRecipe(goal: string): Promise<MonitoringRecipe> {
  return fetchAPI<MonitoringRecipe>('/api/monitoring/generate-recipe', {
    method: 'POST',
    body: JSON.stringify({ goal }),
  });
}

/**
 * Validate monitoring filters and get sample hits
 */
export async function validateMonitoringFilters(
  module_id: number,
  filters: Record<string, any>
): Promise<ValidationResult> {
  return fetchAPI<ValidationResult>('/api/monitoring/validate-filters', {
    method: 'POST',
    body: JSON.stringify({ module_id, filters }),
  });
}

/**
 * Search for hits with given filters
 */
export async function searchHits(
  module_id: number,
  filters: Record<string, any>,
  limit: number = 10
): Promise<Hit[]> {
  return fetchAPI<Hit[]>('/api/monitoring/search-hits', {
    method: 'POST',
    body: JSON.stringify({ module_id, filters, limit }),
  });
}

/**
 * Get available KM24 modules
 */
export async function getModules(): Promise<KM24Module[]> {
  const response = await fetchAPI<{ modules: KM24Module[] }>('/api/modules');
  return response.modules;
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{
  status: string;
  anthropic_status: string;
  km24_status: string;
  km24_modules_count: number;
}> {
  return fetchAPI('/health');
}

export { KM24APIError };
