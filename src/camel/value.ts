import { 
  CaMeLValue, 
  CaMeLValueId, 
  Capabilities, 
  CaMeLSources, 
  Readers,
  CaMeLValueCreationOptions,
  UserSource,
  CaMeLSource,
  ToolSource,
  PublicReaders,
  RestrictedReaders
} from './types';

let valueIdCounter = 0;

export function generateValueId(): CaMeLValueId {
  return `camel_value_${Date.now()}_${++valueIdCounter}`;
}

export function createUserSource(userId?: string): UserSource {
  return {
    type: 'user',
    userId,
    metadata: { createdAt: Date.now() }
  };
}

export function createCaMeLSource(operation: string): CaMeLSource {
  return {
    type: 'camel',
    operation,
    metadata: { createdAt: Date.now() }
  };
}

export function createToolSource(toolName: string, innerSources: readonly CaMeLSources[]): ToolSource {
  return {
    type: 'tool',
    toolName,
    innerSources,
    metadata: { createdAt: Date.now() }
  };
}

export function createPublicReaders(): PublicReaders {
  return { type: 'public' };
}

export function createRestrictedReaders(allowedReaders: readonly string[]): RestrictedReaders {
  return { 
    type: 'restricted', 
    allowedReaders: [...allowedReaders]
  };
}

export function createCapabilities(
  sources: readonly CaMeLSources[],
  readers: Readers,
  options: {
    sensitive?: boolean;
    transformations?: readonly string[];
    metadata?: Record<string, any>;
  } = {}
): Capabilities {
  return {
    sources: [...sources],
    readers,
    sensitive: options.sensitive ?? false,
    transformations: options.transformations ?? [],
    metadata: options.metadata ?? {}
  };
}

export function createCaMeLValue<T>(
  value: T,
  sources: readonly CaMeLSources[],
  readers: Readers,
  options: CaMeLValueCreationOptions = {}
): CaMeLValue<T> {
  const capabilities = createCapabilities(sources, readers, {
    sensitive: options.capabilities?.sensitive,
    transformations: options.capabilities?.transformations,
    metadata: options.capabilities?.metadata
  });

  return {
    id: generateValueId(),
    value,
    capabilities,
    dependencies: options.dependencies ?? [],
    createdAt: Date.now(),
    type: options.type ?? typeof value
  };
}

export function createUserValue<T>(
  value: T,
  userId?: string,
  options: CaMeLValueCreationOptions = {}
): CaMeLValue<T> {
  const userSource = createUserSource(userId);
  const readers = createRestrictedReaders(userId ? [userId] : []);
  
  return createCaMeLValue(value, [userSource], readers, {
    ...options,
    capabilities: {
      sensitive: true,
      ...options.capabilities
    }
  });
}

export function createPublicValue<T>(
  value: T,
  operation: string,
  dependencies: readonly CaMeLValue[] = [],
  options: CaMeLValueCreationOptions = {}
): CaMeLValue<T> {
  const camelSource = createCaMeLSource(operation);
  const publicReaders = createPublicReaders();
  
  return createCaMeLValue(value, [camelSource], publicReaders, {
    ...options,
    dependencies,
    capabilities: {
      sensitive: false,
      ...options.capabilities
    }
  });
}

export function combineCapabilities(
  values: readonly CaMeLValue[],
  operation: string
): Capabilities {
  if (values.length === 0) {
    return createCapabilities(
      [createCaMeLSource(operation)],
      createPublicReaders()
    );
  }

  const allSources = new Set<CaMeLSources>();
  let combinedReaders: Readers = createPublicReaders();
  let isSensitive = false;
  const allTransformations = new Set<string>();
  const combinedMetadata: Record<string, any> = {};

  for (const value of values) {
    value.capabilities.sources.forEach(source => allSources.add(source));
    
    if (value.capabilities.readers.type === 'restricted') {
      if (combinedReaders.type === 'public') {
        combinedReaders = value.capabilities.readers;
      } else if (combinedReaders.type === 'restricted') {
        const intersection = (combinedReaders.allowedReaders || []).filter(reader =>
          (value.capabilities.readers as RestrictedReaders).allowedReaders.includes(reader)
        );
        combinedReaders = createRestrictedReaders(intersection);
      }
    }

    if (value.capabilities.sensitive) {
      isSensitive = true;
    }

    value.capabilities.transformations.forEach(t => allTransformations.add(t));
    Object.assign(combinedMetadata, value.capabilities.metadata);
  }

  allTransformations.add(operation);

  return createCapabilities(
    Array.from(allSources),
    combinedReaders,
    {
      sensitive: isSensitive,
      transformations: Array.from(allTransformations),
      metadata: combinedMetadata
    }
  );
}

export function transformValue<T, U>(
  inputValue: CaMeLValue<T>,
  transformer: (value: T) => U,
  operation: string,
  additionalDependencies: readonly CaMeLValue[] = []
): CaMeLValue<U> {
  const allDependencies = [inputValue, ...additionalDependencies];
  const combinedCapabilities = combineCapabilities(allDependencies, operation);
  
  return {
    id: generateValueId(),
    value: transformer(inputValue.value),
    capabilities: combinedCapabilities,
    dependencies: allDependencies,
    createdAt: Date.now(),
    type: typeof transformer(inputValue.value)
  };
}

export function combineValues<T>(
  values: readonly CaMeLValue<T>[],
  combiner: (values: readonly T[]) => T,
  operation: string
): CaMeLValue<T> {
  const combinedCapabilities = combineCapabilities(values, operation);
  const combinedValue = combiner(values.map(v => v.value));
  
  return {
    id: generateValueId(),
    value: combinedValue,
    capabilities: combinedCapabilities,
    dependencies: [...values],
    createdAt: Date.now(),
    type: typeof combinedValue
  };
}

export function getDependencies(
  value: CaMeLValue,
  visited: Set<CaMeLValueId> = new Set()
): readonly CaMeLValue[] {
  if (visited.has(value.id)) {
    return [];
  }

  visited.add(value.id);
  const directDependencies = [...value.dependencies];
  
  for (const dep of value.dependencies) {
    directDependencies.push(...getDependencies(dep, visited));
  }

  return directDependencies;
}

export function isPublic(value: CaMeLValue): boolean {
  return value.capabilities.readers.type === 'public';
}

export function isTrusted(value: CaMeLValue, userId?: string): boolean {
  const userSources = value.capabilities.sources.filter(s => s.type === 'user');
  if (userSources.length === 0) return false;
  
  if (!userId) return true;
  
  return userSources.some(source => 
    (source as UserSource).userId === userId
  );
}

export function canReadersReadValue(
  readers: readonly string[],
  value: CaMeLValue
): boolean {
  if (value.capabilities.readers.type === 'public') {
    return true;
  }

  const allowedReaders = (value.capabilities.readers as RestrictedReaders).allowedReaders;
  return readers.some(reader => allowedReaders.includes(reader));
}

export function hasSource(value: CaMeLValue, sourceType: CaMeLSources['type']): boolean {
  return value.capabilities.sources.some(source => source.type === sourceType);
}

export function getSourcesByType<T extends CaMeLSources['type']>(
  value: CaMeLValue,
  sourceType: T
): readonly Extract<CaMeLSources, { type: T }>[] {
  return value.capabilities.sources.filter(
    source => source.type === sourceType
  ) as readonly Extract<CaMeLSources, { type: T }>[];
}

export function validateValueIntegrity(value: CaMeLValue): boolean {
  try {
    if (!value.id || !value.capabilities) return false;
    
    if (value.dependencies.some(dep => !validateValueIntegrity(dep))) {
      return false;
    }

    const allDeps = getDependencies(value);
    const expectedCapabilities = combineCapabilities(allDeps, 'validation');
    
    return (
      value.capabilities.sources.length > 0 &&
      value.capabilities.readers !== undefined &&
      value.createdAt > 0
    );
  } catch {
    return false;
  }
}

export function cloneValue<T>(value: CaMeLValue<T>): CaMeLValue<T> {
  return {
    ...value,
    capabilities: {
      ...value.capabilities,
      sources: [...value.capabilities.sources],
      transformations: [...value.capabilities.transformations],
      metadata: { ...value.capabilities.metadata }
    },
    dependencies: [...value.dependencies]
  };
}