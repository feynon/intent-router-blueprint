import { 
  CaMeLValue, 
  DataFlowGraph, 
  DataFlowNode, 
  CaMeLValueId 
} from './types';
import { getDependencies } from './value';

export class CaMeLDataFlowGraph implements DataFlowGraph {
  private _nodes = new Map<string, DataFlowNode>();
  private _edges = new Map<string, readonly string[]>();
  private _rootNodes: string[] = [];
  private _leafNodes: string[] = [];

  get nodes(): Map<string, DataFlowNode> {
    return new Map(this._nodes);
  }

  get edges(): Map<string, readonly string[]> {
    return new Map(this._edges);
  }

  get rootNodes(): readonly string[] {
    return [...this._rootNodes];
  }

  get leafNodes(): readonly string[] {
    return [...this._leafNodes];
  }

  addValue(
    value: CaMeLValue,
    operation: string,
    inputs: readonly CaMeLValue[] = []
  ): DataFlowNode {
    const inputIds = inputs.map(input => input.id);
    const outputIds: string[] = [];

    const node: DataFlowNode = {
      id: value.id,
      value,
      operation,
      inputs: inputIds,
      outputs: outputIds,
      timestamp: Date.now()
    };

    this._nodes.set(value.id, node);
    this._edges.set(value.id, []);

    for (const inputId of inputIds) {
      const inputNode = this._nodes.get(inputId);
      if (inputNode) {
        const updatedInputNode: DataFlowNode = {
          ...inputNode,
          outputs: [...inputNode.outputs, value.id]
        };
        this._nodes.set(inputId, updatedInputNode);

        const currentEdges = this._edges.get(inputId) || [];
        this._edges.set(inputId, [...currentEdges, value.id]);
      }
    }

    this.updateRootAndLeafNodes();
    return node;
  }

  removeValue(valueId: CaMeLValueId): boolean {
    const node = this._nodes.get(valueId);
    if (!node) return false;

    for (const inputId of node.inputs) {
      const inputNode = this._nodes.get(inputId);
      if (inputNode) {
        const updatedOutputs = inputNode.outputs.filter(id => id !== valueId);
        const updatedInputNode: DataFlowNode = {
          ...inputNode,
          outputs: updatedOutputs
        };
        this._nodes.set(inputId, updatedInputNode);

        const currentEdges = this._edges.get(inputId) || [];
        this._edges.set(inputId, currentEdges.filter(id => id !== valueId));
      }
    }

    for (const outputId of node.outputs) {
      const outputNode = this._nodes.get(outputId);
      if (outputNode) {
        const updatedInputs = outputNode.inputs.filter(id => id !== valueId);
        const updatedOutputNode: DataFlowNode = {
          ...outputNode,
          inputs: updatedInputs
        };
        this._nodes.set(outputId, updatedOutputNode);
      }
    }

    this._nodes.delete(valueId);
    this._edges.delete(valueId);
    this.updateRootAndLeafNodes();

    return true;
  }

  getNode(valueId: CaMeLValueId): DataFlowNode | undefined {
    return this._nodes.get(valueId);
  }

  getPath(fromId: CaMeLValueId, toId: CaMeLValueId): readonly CaMeLValueId[] {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (currentId: string, targetId: string, currentPath: string[]): boolean => {
      if (currentId === targetId) {
        path.push(...currentPath, currentId);
        return true;
      }

      if (visited.has(currentId)) {
        return false;
      }

      visited.add(currentId);
      const edges = this._edges.get(currentId) || [];

      for (const neighborId of edges) {
        if (dfs(neighborId, targetId, [...currentPath, currentId])) {
          return true;
        }
      }

      return false;
    };

    dfs(fromId, toId, []);
    return path;
  }

  getAncestors(valueId: CaMeLValueId): readonly CaMeLValueId[] {
    const ancestors = new Set<string>();
    const visited = new Set<string>();

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const node = this._nodes.get(currentId);
      if (!node) return;

      for (const inputId of node.inputs) {
        ancestors.add(inputId);
        dfs(inputId);
      }
    };

    dfs(valueId);
    return Array.from(ancestors);
  }

  getDescendants(valueId: CaMeLValueId): readonly CaMeLValueId[] {
    const descendants = new Set<string>();
    const visited = new Set<string>();

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const edges = this._edges.get(currentId) || [];
      for (const neighborId of edges) {
        descendants.add(neighborId);
        dfs(neighborId);
      }
    };

    dfs(valueId);
    return Array.from(descendants);
  }

  getSubgraph(valueIds: readonly CaMeLValueId[]): CaMeLDataFlowGraph {
    const subgraph = new CaMeLDataFlowGraph();
    const processedNodes = new Set<string>();

    for (const valueId of valueIds) {
      const node = this._nodes.get(valueId);
      if (!node || processedNodes.has(valueId)) continue;

      const relevantInputs = node.inputs.filter(inputId => valueIds.includes(inputId));
      const inputValues = relevantInputs
        .map(inputId => this._nodes.get(inputId)?.value)
        .filter((value): value is CaMeLValue => value !== undefined);

      subgraph.addValue(node.value, node.operation, inputValues);
      processedNodes.add(valueId);
    }

    return subgraph;
  }

  detectCycles(): readonly (readonly CaMeLValueId[])[] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        const cycleStartIndex = path.indexOf(nodeId);
        if (cycleStartIndex !== -1) {
          cycles.push(path.slice(cycleStartIndex));
        }
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const edges = this._edges.get(nodeId) || [];
      for (const neighborId of edges) {
        dfs(neighborId, [...path, nodeId]);
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of this._nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  getTopologicalSort(): readonly CaMeLValueId[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) {
        return false;
      }

      if (visited.has(nodeId)) {
        return true;
      }

      visiting.add(nodeId);

      const edges = this._edges.get(nodeId) || [];
      for (const neighborId of edges) {
        if (!dfs(neighborId)) {
          return false;
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      result.unshift(nodeId);

      return true;
    };

    for (const nodeId of this._nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (!dfs(nodeId)) {
          return [];
        }
      }
    }

    return result;
  }

  getStatistics(): {
    totalNodes: number;
    totalEdges: number;
    averageConnections: number;
    maxDepth: number;
    cycles: number;
  } {
    const totalNodes = this._nodes.size;
    const totalEdges = Array.from(this._edges.values()).reduce((sum, edges) => sum + edges.length, 0);
    const averageConnections = totalNodes > 0 ? totalEdges / totalNodes : 0;

    let maxDepth = 0;
    for (const rootId of this._rootNodes) {
      const depth = this.calculateDepth(rootId);
      maxDepth = Math.max(maxDepth, depth);
    }

    const cycles = this.detectCycles().length;

    return {
      totalNodes,
      totalEdges,
      averageConnections,
      maxDepth,
      cycles
    };
  }

  private calculateDepth(nodeId: string, visited = new Set<string>()): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const edges = this._edges.get(nodeId) || [];
    if (edges.length === 0) return 1;

    let maxChildDepth = 0;
    for (const childId of edges) {
      const childDepth = this.calculateDepth(childId, new Set(visited));
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return 1 + maxChildDepth;
  }

  private updateRootAndLeafNodes(): void {
    this._rootNodes = [];
    this._leafNodes = [];

    for (const [nodeId, node] of this._nodes) {
      if (node.inputs.length === 0) {
        this._rootNodes.push(nodeId);
      }
      if (node.outputs.length === 0) {
        this._leafNodes.push(nodeId);
      }
    }
  }

  serialize(): string {
    const data = {
      nodes: Array.from(this._nodes.entries()).map(([id, node]) => ({
        id,
        operation: node.operation,
        inputs: node.inputs,
        outputs: node.outputs,
        timestamp: node.timestamp,
        value: {
          id: node.value.id,
          type: node.value.type,
          capabilities: node.value.capabilities,
          createdAt: node.value.createdAt
        }
      })),
      edges: Array.from(this._edges.entries()),
      rootNodes: this._rootNodes,
      leafNodes: this._leafNodes
    };

    return JSON.stringify(data);
  }

  static deserialize(serialized: string): CaMeLDataFlowGraph {
    const graph = new CaMeLDataFlowGraph();
    return graph;
  }

  clear(): void {
    this._nodes.clear();
    this._edges.clear();
    this._rootNodes = [];
    this._leafNodes = [];
  }

  clone(): CaMeLDataFlowGraph {
    const cloned = new CaMeLDataFlowGraph();
    cloned._nodes = new Map(this._nodes);
    cloned._edges = new Map(this._edges);
    cloned._rootNodes = [...this._rootNodes];
    cloned._leafNodes = [...this._leafNodes];
    return cloned;
  }
}