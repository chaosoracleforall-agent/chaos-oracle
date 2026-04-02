import * as fs from 'fs';
import * as path from 'path';

interface MetricEntry {
  value: number;
  timestamp: number;
}

interface MetricsData {
  [category: string]: {
    [name: string]: MetricEntry[];
  };
}

const STATE_FILE = path.join(__dirname, 'metrics_history.json');
const MAX_ENTRIES_PER_METRIC = 500; // ~3 weeks at 2-hour intervals

class MetricsStore {
  private data: MetricsData = {};

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        this.data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {
      this.data = {};
    }
  }

  private saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.data, null, 2));
  }

  /**
   * Record a metric data point.
   */
  recordMetric(category: string, name: string, value: number, timestamp?: number) {
    if (!this.data[category]) this.data[category] = {};
    if (!this.data[category][name]) this.data[category][name] = [];

    this.data[category][name].push({
      value,
      timestamp: timestamp || Date.now(),
    });

    // Trim to max entries
    if (this.data[category][name].length > MAX_ENTRIES_PER_METRIC) {
      this.data[category][name] = this.data[category][name].slice(-MAX_ENTRIES_PER_METRIC);
    }

    this.saveState();
  }

  /**
   * Get time-series data for a metric.
   */
  getTimeSeries(category: string, name: string, periodMs?: number): MetricEntry[] {
    const entries = this.data[category]?.[name] || [];
    if (!periodMs) return entries;

    const cutoff = Date.now() - periodMs;
    return entries.filter(e => e.timestamp >= cutoff);
  }

  /**
   * Get the latest value for a metric.
   */
  getLatest(category: string, name: string): number | null {
    const entries = this.data[category]?.[name];
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1].value;
  }

  /**
   * Calculate week-over-week growth rate.
   */
  getGrowthRate(category: string, name: string, periodMs: number = 604800000): number | null {
    const entries = this.data[category]?.[name] || [];
    if (entries.length < 2) return null;

    const now = Date.now();
    const currentPeriod = entries.filter(e => e.timestamp >= now - periodMs);
    const previousPeriod = entries.filter(e => e.timestamp >= now - 2 * periodMs && e.timestamp < now - periodMs);

    if (currentPeriod.length === 0 || previousPeriod.length === 0) return null;

    const currentAvg = currentPeriod.reduce((s, e) => s + e.value, 0) / currentPeriod.length;
    const previousAvg = previousPeriod.reduce((s, e) => s + e.value, 0) / previousPeriod.length;

    if (previousAvg === 0) return null;
    return ((currentAvg - previousAvg) / previousAvg) * 100;
  }

  /**
   * Get all categories and their metric names.
   */
  getCategories(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [cat, metrics] of Object.entries(this.data)) {
      result[cat] = Object.keys(metrics);
    }
    return result;
  }

  /**
   * Get a summary of all latest metrics for reporting.
   */
  getSummary(): string {
    const lines: string[] = [];
    for (const [cat, metrics] of Object.entries(this.data)) {
      for (const [name, entries] of Object.entries(metrics)) {
        if (entries.length === 0) continue;
        const latest = entries[entries.length - 1].value;
        const growth = this.getGrowthRate(cat, name);
        const growthStr = growth !== null ? ` (${growth > 0 ? '+' : ''}${growth.toFixed(1)}% WoW)` : '';
        lines.push(`  ${cat}.${name}: ${latest}${growthStr}`);
      }
    }
    return lines.length > 0 ? lines.join('\n') : '  No metrics recorded yet.';
  }
}

export default new MetricsStore();
