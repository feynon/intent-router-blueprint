import {
  CaMeLValue,
  CaMeLValueId,
  CaMeLSources,
  UserContext,
  DataFlowGraph
} from './types';
import { getDependencies, hasSource, getSourcesByType } from './value';
import { CaMeLDataFlowGraph } from './data-flow-graph';

export interface ProvenanceRecord {
  readonly id: string;
  readonly valueId: CaMeLValueId;
  readonly operation: string;
  readonly timestamp: number;
  readonly actor: string;
  readonly sources: readonly CaMeLSources[];
  readonly transformations: readonly string[];
  readonly parentRecords: readonly string[];
  readonly metadata: Record<string, any>;
}

export interface ProvenanceQuery {
  readonly valueId?: CaMeLValueId;
  readonly operation?: string;
  readonly actor?: string;
  readonly sourceType?: CaMeLSources['type'];
  readonly timeRange?: { start: number; end: number };
  readonly includeTransitive?: boolean;
}

export interface ProvenanceAuditResult {
  readonly compliant: boolean;
  readonly violations: readonly ProvenanceViolation[];
  readonly riskScore: number;
  readonly recommendations: readonly string[];
}

export interface ProvenanceViolation {
  readonly type: 'unauthorized_access' | 'data_leak' | 'chain_break' | 'source_mismatch';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly affectedValues: readonly CaMeLValueId[];
  readonly recordIds: readonly string[];
}

export class ProvenanceTracker {
  private records = new Map<string, ProvenanceRecord>();
  private valueToRecords = new Map<CaMeLValueId, Set<string>>();
  private maxRecords: number;
  private auditPolicies = new Map<string, ProvenanceAuditPolicy>();

  constructor(maxRecords: number = 10000) {
    this.maxRecords = maxRecords;
    this.initializeDefaultAuditPolicies();
  }

  recordOperation(
    value: CaMeLValue,
    operation: string,
    actor: string,
    metadata: Record<string, any> = {}
  ): ProvenanceRecord {
    const dependencies = getDependencies(value);
    const parentRecords = dependencies
      .flatMap(dep => Array.from(this.valueToRecords.get(dep.id) || []))
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const record: ProvenanceRecord = {
      id: this.generateRecordId(),
      valueId: value.id,
      operation,
      timestamp: Date.now(),
      actor,
      sources: [...value.capabilities.sources],
      transformations: [...value.capabilities.transformations],
      parentRecords,
      metadata: { ...metadata }
    };

    this.storeRecord(record);
    return record;
  }

  getProvenanceChain(valueId: CaMeLValueId): readonly ProvenanceRecord[] {
    const chain: ProvenanceRecord[] = [];
    const visited = new Set<string>();

    const traverse = (recordIds: readonly string[]) => {
      for (const recordId of recordIds) {
        if (visited.has(recordId)) continue;
        visited.add(recordId);

        const record = this.records.get(recordId);
        if (record) {
          chain.push(record);
          traverse(record.parentRecords);
        }
      }
    };

    const recordIds = Array.from(this.valueToRecords.get(valueId) || []);
    traverse(recordIds);

    return chain.sort((a, b) => a.timestamp - b.timestamp);
  }

  queryProvenance(query: ProvenanceQuery): readonly ProvenanceRecord[] {
    let results = Array.from(this.records.values());

    if (query.valueId) {
      const recordIds = this.valueToRecords.get(query.valueId);
      if (!recordIds) return [];
      results = results.filter(record => recordIds.has(record.id));
    }

    if (query.operation) {
      results = results.filter(record => 
        record.operation.toLowerCase().includes(query.operation!.toLowerCase())
      );
    }

    if (query.actor) {
      results = results.filter(record => record.actor === query.actor);
    }

    if (query.sourceType) {
      results = results.filter(record =>
        record.sources.some(source => source.type === query.sourceType)
      );
    }

    if (query.timeRange) {
      results = results.filter(record =>
        record.timestamp >= query.timeRange!.start &&
        record.timestamp <= query.timeRange!.end
      );
    }

    if (query.includeTransitive) {
      const transitiveRecords = new Set<ProvenanceRecord>();
      for (const record of results) {
        this.collectTransitiveRecords(record, transitiveRecords);
      }
      results = Array.from(transitiveRecords);
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  auditCompliance(
    values: readonly CaMeLValue[],
    userContext: UserContext
  ): ProvenanceAuditResult {
    const violations: ProvenanceViolation[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    for (const value of values) {
      const chain = this.getProvenanceChain(value.id);
      
      for (const [policyName, policy] of this.auditPolicies) {
        const policyResult = policy.evaluate(value, chain, userContext);
        
        if (policyResult.violations.length > 0) {
          violations.push(...policyResult.violations);
          riskScore += policyResult.riskContribution;
        }
        
        recommendations.push(...policyResult.recommendations);
      }
    }

    const uniqueRecommendations = [...new Set(recommendations)];
    const normalizedRiskScore = Math.min(100, riskScore);

    return {
      compliant: violations.length === 0,
      violations,
      riskScore: normalizedRiskScore,
      recommendations: uniqueRecommendations
    };
  }

  generateDataLineageReport(valueId: CaMeLValueId): string {
    const chain = this.getProvenanceChain(valueId);
    
    if (chain.length === 0) {
      return `No provenance records found for value: ${valueId}`;
    }

    const report: string[] = [
      `Data Lineage Report for Value: ${valueId}`,
      `Generated: ${new Date().toISOString()}`,
      `Total Operations: ${chain.length}`,
      '',
      'Chronological History:'
    ];

    for (let i = 0; i < chain.length; i++) {
      const record = chain[i];
      const timestamp = new Date(record.timestamp).toISOString();
      
      report.push(`
${i + 1}. Operation: ${record.operation}
   Timestamp: ${timestamp}
   Actor: ${record.actor}
   Sources: ${record.sources.map(s => s.type).join(', ')}
   Transformations: ${record.transformations.join(' -> ')}
   Parent Records: ${record.parentRecords.length}
      `.trim());
    }

    const uniqueSources = new Set(chain.flatMap(r => r.sources.map(s => s.type)));
    const uniqueActors = new Set(chain.map(r => r.actor));
    
    report.push('', 'Summary:');
    report.push(`- Unique Sources: ${Array.from(uniqueSources).join(', ')}`);
    report.push(`- Unique Actors: ${Array.from(uniqueActors).join(', ')}`);
    report.push(`- Data Age: ${Date.now() - chain[0].timestamp}ms`);

    return report.join('\n');
  }

  exportProvenance(): string {
    const exportData = {
      records: Array.from(this.records.values()),
      valueToRecords: Object.fromEntries(
        Array.from(this.valueToRecords.entries()).map(([key, set]) => [key, Array.from(set)])
      ),
      exportedAt: Date.now(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  importProvenance(data: string): void {
    try {
      const importData = JSON.parse(data);
      
      this.records.clear();
      this.valueToRecords.clear();

      for (const record of importData.records) {
        this.storeRecord(record);
      }
    } catch (error) {
      throw new Error(`Failed to import provenance data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getStatistics(): {
    totalRecords: number;
    uniqueValues: number;
    averageChainLength: number;
    oldestRecord: number;
    newestRecord: number;
  } {
    const records = Array.from(this.records.values());
    
    if (records.length === 0) {
      return {
        totalRecords: 0,
        uniqueValues: 0,
        averageChainLength: 0,
        oldestRecord: 0,
        newestRecord: 0
      };
    }

    const timestamps = records.map(r => r.timestamp);
    const chainLengths = Array.from(this.valueToRecords.values()).map(set => set.size);
    const averageChainLength = chainLengths.reduce((sum, len) => sum + len, 0) / chainLengths.length;

    return {
      totalRecords: records.length,
      uniqueValues: this.valueToRecords.size,
      averageChainLength,
      oldestRecord: Math.min(...timestamps),
      newestRecord: Math.max(...timestamps)
    };
  }

  clearOldRecords(maxAge: number): number {
    const cutoffTime = Date.now() - maxAge;
    const recordsToDelete: string[] = [];

    for (const [recordId, record] of this.records) {
      if (record.timestamp < cutoffTime) {
        recordsToDelete.push(recordId);
      }
    }

    for (const recordId of recordsToDelete) {
      this.deleteRecord(recordId);
    }

    return recordsToDelete.length;
  }

  private storeRecord(record: ProvenanceRecord): void {
    if (this.records.size >= this.maxRecords) {
      const oldestRecord = Array.from(this.records.values())
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      this.deleteRecord(oldestRecord.id);
    }

    this.records.set(record.id, record);
    
    const valueRecords = this.valueToRecords.get(record.valueId) || new Set();
    valueRecords.add(record.id);
    this.valueToRecords.set(record.valueId, valueRecords);
  }

  private deleteRecord(recordId: string): void {
    const record = this.records.get(recordId);
    if (record) {
      this.records.delete(recordId);
      
      const valueRecords = this.valueToRecords.get(record.valueId);
      if (valueRecords) {
        valueRecords.delete(recordId);
        if (valueRecords.size === 0) {
          this.valueToRecords.delete(record.valueId);
        }
      }
    }
  }

  private collectTransitiveRecords(
    record: ProvenanceRecord,
    collected: Set<ProvenanceRecord>
  ): void {
    if (collected.has(record)) return;
    collected.add(record);

    for (const parentId of record.parentRecords) {
      const parentRecord = this.records.get(parentId);
      if (parentRecord) {
        this.collectTransitiveRecords(parentRecord, collected);
      }
    }
  }

  private generateRecordId(): string {
    return `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultAuditPolicies(): void {
    this.auditPolicies.set('unauthorized_user_data_access', {
      evaluate: (value, chain, userContext) => {
        const violations: ProvenanceViolation[] = [];
        const recommendations: string[] = [];
        let riskContribution = 0;

        const userDataRecords = chain.filter(record =>
          record.sources.some(source => source.type === 'user')
        );

        for (const record of userDataRecords) {
          if (record.actor !== userContext.userId && !userContext.permissions.includes('admin')) {
            violations.push({
              type: 'unauthorized_access',
              severity: 'high',
              description: `User data accessed by unauthorized actor: ${record.actor}`,
              affectedValues: [value.id],
              recordIds: [record.id]
            });
            riskContribution += 25;
          }
        }

        if (violations.length > 0) {
          recommendations.push('Review access controls for user data');
          recommendations.push('Implement stricter authentication policies');
        }

        return { violations, recommendations, riskContribution };
      }
    });

    this.auditPolicies.set('external_data_contamination', {
      evaluate: (value, chain, userContext) => {
        const violations: ProvenanceViolation[] = [];
        const recommendations: string[] = [];
        let riskContribution = 0;

        const hasExternalSources = chain.some(record =>
          record.sources.some(source => source.type === 'external')
        );

        const hasSensitiveOperations = chain.some(record =>
          ['execute', 'send', 'publish'].some(op => record.operation.includes(op))
        );

        if (hasExternalSources && hasSensitiveOperations) {
          violations.push({
            type: 'data_leak',
            severity: 'critical',
            description: 'External data used in sensitive operations',
            affectedValues: [value.id],
            recordIds: chain.map(r => r.id)
          });
          riskContribution += 50;
          recommendations.push('Quarantine external data before sensitive operations');
        }

        return { violations, recommendations, riskContribution };
      }
    });
  }
}

interface ProvenanceAuditPolicy {
  evaluate(
    value: CaMeLValue,
    chain: readonly ProvenanceRecord[],
    userContext: UserContext
  ): {
    violations: ProvenanceViolation[];
    recommendations: string[];
    riskContribution: number;
  };
}