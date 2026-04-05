import { SavedChart, NatalChart, BirthData, AIReport } from '@/types';

const STORAGE_KEY = 'astromap_saved_charts';

export function saveChart(
  name: string,
  chart: NatalChart,
  aiReport?: AIReport | null,
  solarReport?: AIReport | null,
  solarRevolution?: NatalChart | null,
  solarYear?: number | null
): SavedChart {
  const savedChart: SavedChart = {
    id: generateId(),
    name: name || `${chart.birthData.name} - ${chart.birthData.date}`,
    birthData: chart.birthData,
    chart,
    createdAt: new Date().toISOString(),
    aiReport: aiReport || undefined,
    solarReport: solarReport || undefined,
    solarRevolution: solarRevolution || undefined,
    solarYear: solarYear || undefined,
  };

  const charts = getSavedCharts();
  charts.push(savedChart);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));

  return savedChart;
}

export function getSavedCharts(): SavedChart[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function loadChart(id: string): SavedChart | null {
  const charts = getSavedCharts();
  return charts.find(c => c.id === id) || null;
}

export function deleteChart(id: string): boolean {
  const charts = getSavedCharts();
  const filtered = charts.filter(c => c.id !== id);
  
  if (filtered.length < charts.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
  
  return false;
}

export function updateChart(id: string, updates: Partial<SavedChart>): SavedChart | null {
  const charts = getSavedCharts();
  const index = charts.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  charts[index] = { ...charts[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
  
  return charts[index];
}

export function clearAllCharts(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportChartToJSON(chart: SavedChart): string {
  return JSON.stringify(chart, null, 2);
}

export function importChartFromJSON(json: string): SavedChart | null {
  try {
    const data = JSON.parse(json);
    
    // Validar estrutura básica
    if (!data.birthData || !data.chart) {
      throw new Error('Invalid chart data');
    }
    
    // Gerar novo ID para evitar conflitos
    return saveChart(data.name, data.chart);
  } catch (error) {
    console.error('Import error:', error);
    return null;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
