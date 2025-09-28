// performance-monitor.ts
interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  timing: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
  workflowStats: {
    nodeCount: number;
    edgeCount: number;
    iterationNodeCount: number;
    complexityScore: number;
  };
  systemInfo: {
    userAgent: string;
    timestamp: number;
  };
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private activeTimers: Map<string, number> = new Map();

  // Start monitoring a workflow operation
  startMonitoring(operationId: string, workflowData?: any): void {
    const startTime = performance.now();
    this.activeTimers.set(operationId, startTime);

    const metrics: PerformanceMetrics = {
      memoryUsage: this.getMemoryUsage(),
      timing: {
        startTime,
      },
      workflowStats: workflowData ? this.calculateWorkflowStats(workflowData) : {
        nodeCount: 0,
        edgeCount: 0,
        iterationNodeCount: 0,
        complexityScore: 0,
      },
      systemInfo: {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
    };

    this.metrics.set(operationId, metrics);
  }

  // Stop monitoring and calculate final metrics
  stopMonitoring(operationId: string): PerformanceMetrics | null {
    const startTime = this.activeTimers.get(operationId);
    if (!startTime) {
      console.warn(`No active timer found for operation: ${operationId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics = this.metrics.get(operationId);
    if (metrics) {
      metrics.timing.endTime = endTime;
      metrics.timing.duration = duration;
      metrics.memoryUsage = this.getMemoryUsage(); // Update memory after operation
    }

    this.activeTimers.delete(operationId);
    return metrics || null;
  }

  // Get current memory usage (approximation for browser)
  private getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    // Browser memory API is limited, so we approximate
    const memoryInfo = (performance as any).memory;

    if (memoryInfo) {
      return {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize,
        percentage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100,
      };
    }

    // Fallback when memory API is not available
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }

  // Calculate workflow complexity metrics
  private calculateWorkflowStats(workflowData: any): PerformanceMetrics['workflowStats'] {
    const nodes = workflowData?.workflow?.graph?.nodes || [];
    const edges = workflowData?.workflow?.graph?.edges || [];

    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const iterationNodeCount = nodes.filter((node: any) => node.type === 'iteration').length;

    // Calculate complexity score based on various factors
    const llmNodeCount = nodes.filter((node: any) => node.type === 'llm').length;
    const ifElseNodeCount = nodes.filter((node: any) => node.type === 'if-else').length;
    const aggregatorNodeCount = nodes.filter((node: any) => node.type === 'variable-aggregator').length;

    const complexityScore =
      nodeCount * 1 +
      edgeCount * 0.5 +
      iterationNodeCount * 3 +
      llmNodeCount * 2 +
      ifElseNodeCount * 1.5 +
      aggregatorNodeCount * 2;

    return {
      nodeCount,
      edgeCount,
      iterationNodeCount,
      complexityScore: Math.round(complexityScore * 100) / 100,
    };
  }

  // Get metrics for a specific operation
  getMetrics(operationId: string): PerformanceMetrics | null {
    return this.metrics.get(operationId) || null;
  }

  // Get all metrics
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  // Generate performance report
  generateReport(operationId?: string): string {
    const metrics = operationId ?
      [this.metrics.get(operationId)].filter(Boolean) :
      Array.from(this.metrics.values());

    if (metrics.length === 0) {
      return 'No performance metrics available.';
    }

    let report = '=== PERFORMANCE MONITORING REPORT ===\n\n';

    metrics.forEach((metric, index) => {
      const opId = operationId || `Operation ${index + 1}`;
      report += `📊 ${opId}\n`;
      report += `├─ ⏱️  Duration: ${metric.timing.duration?.toFixed(2) || 'N/A'}ms\n`;
      report += `├─ 🧠 Memory: ${(metric.memoryUsage.used / 1024 / 1024).toFixed(2)}MB (${metric.memoryUsage.percentage.toFixed(1)}%)\n`;
      report += `├─ 🔗 Nodes: ${metric.workflowStats.nodeCount}\n`;
      report += `├─ 🔄 Iterations: ${metric.workflowStats.iterationNodeCount}\n`;
      report += `├─ 📈 Complexity Score: ${metric.workflowStats.complexityScore}\n`;
      report += `└─ 📅 Timestamp: ${new Date(metric.systemInfo.timestamp).toLocaleString()}\n\n`;
    });

    // Add summary statistics if multiple operations
    if (metrics.length > 1) {
      const avgDuration = metrics.reduce((sum, m) => sum + (m.timing.duration || 0), 0) / metrics.length;
      const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage.used, 0) / metrics.length;
      const avgComplexity = metrics.reduce((sum, m) => sum + m.workflowStats.complexityScore, 0) / metrics.length;

      report += '📈 SUMMARY STATISTICS\n';
      report += `├─ Average Duration: ${avgDuration.toFixed(2)}ms\n`;
      report += `├─ Average Memory: ${(avgMemory / 1024 / 1024).toFixed(2)}MB\n`;
      report += `└─ Average Complexity: ${avgComplexity.toFixed(2)}\n\n`;
    }

    return report;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  // Performance monitoring for workflow import
  async monitorWorkflowImport(workflowData: any): Promise<PerformanceMetrics> {
    const operationId = `import-${Date.now()}`;
    this.startMonitoring(operationId, workflowData);

    // Simulate the actual import process timing
    await new Promise(resolve => setTimeout(resolve, 1));

    const finalMetrics = this.stopMonitoring(operationId);
    return finalMetrics!;
  }

  // Performance monitoring for DSL parsing
  async monitorDSLParsing(dslData: any): Promise<PerformanceMetrics> {
    const operationId = `dsl-parse-${Date.now()}`;
    this.startMonitoring(operationId, dslData);

    // The actual parsing would happen here
    await new Promise(resolve => setTimeout(resolve, 1));

    const finalMetrics = this.stopMonitoring(operationId);
    return finalMetrics!;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy monitoring
export const monitorOperation = async <T>(
  operationName: string,
  operation: () => Promise<T> | T,
  workflowData?: any
): Promise<{ result: T; metrics: PerformanceMetrics }> => {
  const operationId = `${operationName}-${Date.now()}`;
  performanceMonitor.startMonitoring(operationId, workflowData);

  try {
    const result = await operation();
    const metrics = performanceMonitor.stopMonitoring(operationId)!;
    return { result, metrics };
  } catch (error) {
    performanceMonitor.stopMonitoring(operationId);
    throw error;
  }
};

export type { PerformanceMetrics };