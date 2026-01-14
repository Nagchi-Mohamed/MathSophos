'use client';

export interface CalculationHistoryItem {
  id: string;
  type: string;
  expression: string;
  result: string;
  timestamp: number;
  favorite: boolean;
}

const STORAGE_KEY = 'mathsophos_calc_history';
const MAX_ITEMS = 50;

export class HistoryService {
  private static instance: HistoryService;

  private constructor() { }

  public static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  getHistory(filterType?: string): CalculationHistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const history: CalculationHistoryItem[] = JSON.parse(stored);

      if (filterType) {
        return history.filter(item => item.type === filterType);
      }

      return history;
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  addEntry(item: Omit<CalculationHistoryItem, 'id' | 'timestamp' | 'favorite'>): CalculationHistoryItem {
    if (typeof window === 'undefined') {
      return {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
        favorite: false
      };
    }

    try {
      const history = this.getHistory();

      const newItem: CalculationHistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
        favorite: false
      };

      const newHistory = [newItem, ...history].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

      return newItem;
    } catch (error) {
      console.error('Error saving history:', error);
      throw error;
    }
  }

  toggleFavorite(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getHistory();
      const newHistory = history.map(item =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  deleteEntry(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getHistory();
      const newHistory = history.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }
}

export const historyService = HistoryService.getInstance();
