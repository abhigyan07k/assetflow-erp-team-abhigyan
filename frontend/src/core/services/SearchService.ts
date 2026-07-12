import type { ApplicationState, Asset, Employee } from '@core/types';

export interface SearchResults {
  assets: readonly Asset[];
  employees: readonly Employee[];
}

export class SearchService {
  search(state: Readonly<ApplicationState>, query: string): SearchResults {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return { assets: [], employees: [] };

    return {
      assets: state.assets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(normalized) ||
          asset.assetTag.toLowerCase().includes(normalized) ||
          asset.serial.toLowerCase().includes(normalized)
      ),
      employees: state.employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(normalized) ||
          employee.email.toLowerCase().includes(normalized)
      )
    };
  }
}

export const searchService = new SearchService();
