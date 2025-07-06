import {
  CaMeLValue,
  CaMeLValueId,
  UserContext
} from './types';
import { ProvenanceTracker } from './provenance-tracker';

export interface MemoryManagerConfig {
  maxMemoryUsage: number;
  maxValues: number;
  gcInterval: number;
  retentionPolicies: RetentionPolicy[];
  compressionEnabled: boolean;
}

export interface RetentionPolicy {
  name: string;
  priority: number;
  shouldRetain: (value: CaMeLValue, age: number, usage: number) => boolean;
}

export interface MemoryStats {
  totalValues: number;
  memoryUsage: number;
  oldestValue: number;
  newestValue: number;
  averageSize: number;
  hitRate: number;
}

export interface ValueMetrics {
  accessCount: number;
  lastAccessed: number;
  size: number;
  retentionScore: number;
}

export class BrowserMemoryManager {
  private values = new Map<CaMeLValueId, CaMeLValue>();
  private metrics = new Map<CaMeLValueId, ValueMetrics>();
  private accessHistory = new Map<CaMeLValueId, number[]>();
  private config: MemoryManagerConfig;
  private provenanceTracker?: ProvenanceTracker;
  private gcTimer?: number;
  private weakRefs = new WeakMap<object, CaMeLValueId>();
  private compressionWorker?: Worker;

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = {
      maxMemoryUsage: config.maxMemoryUsage || 50 * 1024 * 1024, // 50MB
      maxValues: config.maxValues || 10000,
      gcInterval: config.gcInterval || 30000, // 30 seconds
      retentionPolicies: config.retentionPolicies || this.createDefaultRetentionPolicies(),
      compressionEnabled: config.compressionEnabled ?? true
    };

    this.startGarbageCollection();
    this.initializeCompressionWorker();
  }

  storeValue(value: CaMeLValue, userContext?: UserContext): void {
    if (this.values.has(value.id)) {
      this.updateAccessMetrics(value.id);
      return;
    }

    if (this.shouldEnforceMemoryLimits()) {
      this.enforceMemoryLimits();
    }

    const size = this.calculateValueSize(value);
    const metrics: ValueMetrics = {
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      retentionScore: this.calculateRetentionScore(value, userContext)
    };

    this.values.set(value.id, value);
    this.metrics.set(value.id, metrics);
    this.accessHistory.set(value.id, [Date.now()]);

    if (userContext && this.provenanceTracker) {
      this.provenanceTracker.recordOperation(
        value,
        'store',
        userContext.userId || 'system',
        { memorySize: size }
      );
    }

    this.registerWeakReference(value);
  }

  getValue(valueId: CaMeLValueId): CaMeLValue | undefined {
    const value = this.values.get(valueId);
    if (value) {
      this.updateAccessMetrics(valueId);
    }
    return value;
  }

  hasValue(valueId: CaMeLValueId): boolean {
    return this.values.has(valueId);
  }

  removeValue(valueId: CaMeLValueId): boolean {
    const removed = this.values.delete(valueId);
    if (removed) {
      this.metrics.delete(valueId);
      this.accessHistory.delete(valueId);
    }
    return removed;
  }

  getAllValues(): readonly CaMeLValue[] {
    return Array.from(this.values.values());
  }

  getValuesByType(type: string): readonly CaMeLValue[] {
    return Array.from(this.values.values()).filter(value => value.type === type);
  }

  getValuesBySource(sourceType: string): readonly CaMeLValue[] {
    return Array.from(this.values.values()).filter(value =>
      value.capabilities.sources.some(source => source.type === sourceType)
    );
  }

  compactMemory(aggressiveness: 'light' | 'medium' | 'aggressive' = 'medium'): number {
    const initialCount = this.values.size;
    const thresholds = {
      light: { age: 300000, usage: 1 }, // 5 minutes, 1 access
      medium: { age: 600000, usage: 2 }, // 10 minutes, 2 accesses
      aggressive: { age: 900000, usage: 5 } // 15 minutes, 5 accesses
    };

    const threshold = thresholds[aggressiveness];
    const now = Date.now();
    const toRemove: CaMeLValueId[] = [];

    for (const [valueId, metrics] of this.metrics) {
      const age = now - metrics.lastAccessed;
      const shouldRetain = this.config.retentionPolicies.some(policy =>
        policy.shouldRetain(this.values.get(valueId)!, age, metrics.accessCount)
      );

      if (!shouldRetain && (age > threshold.age || metrics.accessCount < threshold.usage)) {
        toRemove.push(valueId);
      }
    }

    for (const valueId of toRemove) {
      this.removeValue(valueId);
    }

    return initialCount - this.values.size;
  }

  async compressValue(valueId: CaMeLValueId): Promise<boolean> {
    if (!this.config.compressionEnabled || !this.compressionWorker) {
      return false;
    }

    const value = this.values.get(valueId);
    if (!value) return false;

    try {
      const compressed = await this.performCompression(value);
      if (compressed.size < this.calculateValueSize(value)) {
        this.values.set(valueId, compressed);
        this.updateMetrics(valueId, { size: this.calculateValueSize(compressed) });
        return true;
      }
    } catch (error) {
      console.warn(`Compression failed for value ${valueId}:`, error);
    }

    return false;
  }

  getMemoryStats(): MemoryStats {
    const values = Array.from(this.values.values());
    const metricsArray = Array.from(this.metrics.values());
    
    if (values.length === 0) {
      return {
        totalValues: 0,
        memoryUsage: 0,
        oldestValue: 0,
        newestValue: 0,
        averageSize: 0,
        hitRate: 0
      };
    }

    const memoryUsage = metricsArray.reduce((sum, m) => sum + m.size, 0);
    const timestamps = values.map(v => v.createdAt);
    const totalAccesses = metricsArray.reduce((sum, m) => sum + m.accessCount, 0);
    const totalRequests = metricsArray.length;

    return {
      totalValues: values.length,
      memoryUsage,
      oldestValue: Math.min(...timestamps),
      newestValue: Math.max(...timestamps),
      averageSize: memoryUsage / values.length,
      hitRate: totalRequests > 0 ? totalAccesses / totalRequests : 0
    };
  }

  setProvenanceTracker(tracker: ProvenanceTracker): void {
    this.provenanceTracker = tracker;
  }

  exportMemoryState(): string {
    const exportData = {
      values: Array.from(this.values.entries()),
      metrics: Array.from(this.metrics.entries()),
      accessHistory: Array.from(this.accessHistory.entries()),
      config: this.config,
      timestamp: Date.now()
    };

    return JSON.stringify(exportData);
  }

  importMemoryState(data: string): void {
    try {
      const importData = JSON.parse(data);
      
      this.values.clear();
      this.metrics.clear();
      this.accessHistory.clear();

      for (const [id, value] of importData.values) {
        this.values.set(id, value);
      }

      for (const [id, metrics] of importData.metrics) {
        this.metrics.set(id, metrics);
      }

      for (const [id, history] of importData.accessHistory) {
        this.accessHistory.set(id, history);
      }
    } catch (error) {
      throw new Error(`Failed to import memory state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  cleanup(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }

    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    this.values.clear();
    this.metrics.clear();
    this.accessHistory.clear();
  }

  private shouldEnforceMemoryLimits(): boolean {
    const stats = this.getMemoryStats();
    return stats.memoryUsage > this.config.maxMemoryUsage || 
           stats.totalValues > this.config.maxValues;
  }

  private enforceMemoryLimits(): void {
    const stats = this.getMemoryStats();
    
    if (stats.memoryUsage > this.config.maxMemoryUsage) {
      this.compactMemory('aggressive');
    }
    
    if (stats.totalValues > this.config.maxValues) {
      const excessValues = stats.totalValues - this.config.maxValues;
      this.removeLeastValuableValues(excessValues);
    }
  }

  private removeLeastValuableValues(count: number): void {
    const valueScores = Array.from(this.values.keys()).map(id => ({
      id,
      score: this.calculateValueScore(id)
    })).sort((a, b) => a.score - b.score);

    for (let i = 0; i < Math.min(count, valueScores.length); i++) {
      this.removeValue(valueScores[i].id);
    }
  }

  private calculateValueScore(valueId: CaMeLValueId): number {
    const metrics = this.metrics.get(valueId);
    if (!metrics) return 0;

    const age = Date.now() - metrics.lastAccessed;
    const accessFrequency = metrics.accessCount / (age / 1000); // accesses per second
    const sizeScore = 1 / Math.log(metrics.size + 1); // smaller values score higher

    return metrics.retentionScore * accessFrequency * sizeScore;
  }

  private calculateRetentionScore(value: CaMeLValue, userContext?: UserContext): number {
    let score = 1;

    if (value.capabilities.sensitive) score += 2;
    if (value.capabilities.sources.some(s => s.type === 'user')) score += 3;
    if (value.dependencies.length > 0) score += 1;
    if (userContext?.trustLevel === 'high') score += 1;

    return score;
  }

  private updateAccessMetrics(valueId: CaMeLValueId): void {
    const metrics = this.metrics.get(valueId);
    if (metrics) {
      metrics.accessCount++;
      metrics.lastAccessed = Date.now();
      
      const history = this.accessHistory.get(valueId) || [];
      history.push(Date.now());
      
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      this.accessHistory.set(valueId, history);
    }
  }

  private updateMetrics(valueId: CaMeLValueId, updates: Partial<ValueMetrics>): void {
    const metrics = this.metrics.get(valueId);
    if (metrics) {
      Object.assign(metrics, updates);
    }
  }

  private calculateValueSize(value: CaMeLValue): number {
    try {
      return new TextEncoder().encode(JSON.stringify(value)).length;
    } catch {
      return 1000; // fallback estimate
    }
  }

  private registerWeakReference(value: CaMeLValue): void {
    if (typeof value.value === 'object' && value.value !== null) {
      this.weakRefs.set(value.value, value.id);
    }
  }

  private createDefaultRetentionPolicies(): RetentionPolicy[] {
    return [
      {
        name: 'user_data_retention',
        priority: 100,
        shouldRetain: (value, age, usage) => {
          return value.capabilities.sources.some(s => s.type === 'user') && age < 3600000; // 1 hour
        }
      },
      {
        name: 'high_usage_retention',
        priority: 80,
        shouldRetain: (value, age, usage) => {
          return usage > 5 && age < 1800000; // 30 minutes
        }
      },
      {
        name: 'sensitive_data_retention',
        priority: 90,
        shouldRetain: (value, age, usage) => {
          return value.capabilities.sensitive && age < 600000; // 10 minutes
        }
      }
    ];
  }

  private startGarbageCollection(): void {
    this.gcTimer = window.setInterval(() => {
      this.performGarbageCollection();
    }, this.config.gcInterval);
  }

  private performGarbageCollection(): void {
    const removed = this.compactMemory('light');
    
    if (removed > 0) {
      console.debug(`Memory GC: Removed ${removed} values`);
    }
  }

  private initializeCompressionWorker(): void {
    if (!this.config.compressionEnabled || typeof Worker === 'undefined') {
      return;
    }

    try {
      const workerBlob = new Blob([this.getCompressionWorkerCode()], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      this.compressionWorker = new Worker(workerUrl);
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
    }
  }

  private getCompressionWorkerCode(): string {
    return `
      self.onmessage = function(e) {
        const { id, data } = e.data;
        try {
          // Simple compression using JSON stringification with reduced precision
          const compressed = JSON.stringify(data, (key, value) => {
            if (typeof value === 'number' && !Number.isInteger(value)) {
              return Math.round(value * 1000) / 1000; // 3 decimal places
            }
            return value;
          });
          
          self.postMessage({ id, compressed: compressed, success: true });
        } catch (error) {
          self.postMessage({ id, error: error.message, success: false });
        }
      };
    `;
  }

  private async performCompression(value: CaMeLValue): Promise<CaMeLValue> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        reject(new Error('Compression worker not available'));
        return;
      }

      const id = Math.random().toString(36);
      const timeout = setTimeout(() => {
        reject(new Error('Compression timeout'));
      }, 5000);

      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          clearTimeout(timeout);
          this.compressionWorker!.removeEventListener('message', handler);
          
          if (e.data.success) {
            try {
              const compressedValue = { ...value, value: JSON.parse(e.data.compressed) };
              resolve(compressedValue);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      this.compressionWorker.addEventListener('message', handler);
      this.compressionWorker.postMessage({ id, data: value.value });
    });
  }
}