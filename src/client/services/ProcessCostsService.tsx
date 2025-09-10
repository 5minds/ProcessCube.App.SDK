type ProcessCostsExpressionParams = {
  correlationMetadata?: any;
  currentFlowNode?: any;
  dataObjects?: Record<string, any>;
  flowNodeExecutionCount?: number | null;
  processInstanceMetadata?: any;
  token?: {
    current?: any;
    history?: Record<string, any>;
  };
};

type FlowNodeDefinition = {
  id: string;
  customProperties: Record<string, string>;
};

type CostCalculationResult = {
  total: number;
  errors: number;
  average: number;
  reference?: number;
  critical?: number;
  warning?: number;
};

export class ProcessCostsService {
  private flowNodeInstances: any[];
  private processCostsExpressionParams: ProcessCostsExpressionParams;
  private instances: any[];
  private costResultsByFlowNodeId: Record<string, Record<string, CostCalculationResult>> = {};
  private instanceCounter: Record<string, number> = {};
  private thresholdsByFlowNodeId: Record<
    string,
    Record<
      string,
      {
        reference?: number;
        warning?: number;
        critical?: number;
      }
    >
  > = {};

  constructor(databaseProcessInstance: any, flowNodeDefinitions: FlowNodeDefinition[]) {
    this.instances = databaseProcessInstance;
    this.flowNodeInstances = databaseProcessInstance.flatMap(
      (instance: any) => instance.process_instance.flowNodeInstances || [],
    );

    this.processCostsExpressionParams = {
      correlationMetadata: {},
      processInstanceMetadata: {},
    };

    this.precalculateCosts(flowNodeDefinitions);
  }

  public getInstanceCount(flowNodeId: string): number | undefined {
    return this.instanceCounter[flowNodeId];
  }

  public getCostsForFlowNodeId(flowNodeId: string): Record<string, CostCalculationResult> | undefined {
    return this.costResultsByFlowNodeId[flowNodeId];
  }

  public getAllProcessCosts() {
    return this.costResultsByFlowNodeId;
  }

  public getFlowNodeExecutionCount(flowNodeId: string, flowNodeInstanceId: string): number {
    let count = 0;
    for (const fni of this.flowNodeInstances) {
      if (fni.id === flowNodeId && fni.flowNodeExitedAt) {
        count++;
        if (fni.flowNodeInstanceId === flowNodeInstanceId) break;
      }
    }
    return count;
  }

  public getProcessInstanceCount(): number {
    return this.instances.length;
  }

  private splitCostProperties(customProps: Record<string, string>): {
    costExpressions: Record<string, string>;
    thresholds: Record<string, { reference?: number; warning?: number; critical?: number }>;
  } {
    const costExpressions: Record<string, string> = {};
    const thresholds: Record<string, { reference?: number; warning?: number; critical?: number }> = {};

    for (const [key, value] of Object.entries(customProps)) {
      const match = key.match(/^pilot\.setProcessCosts\.([^.]+)\.(value|reference|warning|critical)$/);

      if (match) {
        const costId = match[1];
        const costType = match[2];

        if (costType === 'value') {
          costExpressions[costId] = value;
        } else {
          const numericValue = parseFloat(value);

          if (!thresholds[costId]) thresholds[costId] = {};

          if (!isNaN(numericValue)) {
            if (costType === 'reference') {
              thresholds[costId].reference = numericValue;
            } else {
              thresholds[costId][costType as 'warning' | 'critical'] = numericValue / 100;
            }
          }
        }
      }
    }

    return { costExpressions, thresholds };
  }

  private precalculateCosts(flowNodeDefs: FlowNodeDefinition[]) {
    for (const def of flowNodeDefs) {
      const flowNodeId = def.id;
      const { costExpressions, thresholds } = this.splitCostProperties(def.customProperties);

      if (Object.keys(thresholds).length > 0) {
        this.thresholdsByFlowNodeId[flowNodeId] = thresholds;
      }
      let instanceCount = 0;

      for (const fni of this.flowNodeInstances) {
        if (flowNodeId === fni.id && fni.flowNodeExitedAt) {
          instanceCount += 1;
          this.setProcessCostExpressionParamsForInstance(fni);
          const costResults = this.getProcessCosts(costExpressions);

          if (Object.keys(costResults).length === 0) {
            continue;
          }

          if (!this.costResultsByFlowNodeId[flowNodeId]) {
            this.costResultsByFlowNodeId[flowNodeId] = {};
          }

          for (const [key, value] of Object.entries(costResults)) {
            const num = parseFloat(value);
            const existingThresholds = thresholds[key] ?? this.thresholdsByFlowNodeId[flowNodeId]?.[key] ?? {};

            const result = this.costResultsByFlowNodeId[flowNodeId][key] ?? {
              total: 0,
              errors: 0,
              average: 0,
              count: 0,
              ...existingThresholds,
            };

            if (!isNaN(num)) {
              result.total += num;
            } else {
              result.errors += 1;
            }

            this.costResultsByFlowNodeId[flowNodeId][key] = result;
          }
        }
      }

      this.instanceCounter[flowNodeId] = instanceCount;
    }

    for (const nodeId in this.costResultsByFlowNodeId) {
      for (const key in this.costResultsByFlowNodeId[nodeId]) {
        const result = this.costResultsByFlowNodeId[nodeId][key];
        const count = this.instanceCounter[nodeId];
        const average = count > 0 ? result.total / (count - result.errors) : 0;

        result.average = !isNaN(average) ? average : 0;
      }
    }
  }

  private getProcessCosts(customProps: Record<string, string>): Record<string, string> {
    const evaluatedProcessCosts: Record<string, string> = {};

    for (const [key, expression] of Object.entries(customProps)) {
      if (!expression) continue;

      let isError = false;

      const resolvedExpression = expression.replace(/\$\{(.+?)\}/g, (_, path) => {
        const value = path
          .split('.')
          .reduce((acc: any, key: string) => acc && acc[key], this.processCostsExpressionParams);

        if (value === undefined || isNaN(value)) {
          isError = true;
          return 'invalid';
        }

        return value.toString();
      });

      if (
        isError ||
        resolvedExpression.includes('$') ||
        resolvedExpression.includes('{') ||
        resolvedExpression.includes('}')
      ) {
        evaluatedProcessCosts[key] = `{ Error: Invalid expression. }`;
        continue;
      }

      try {
        const resultValue = new Function('Math', `return ${resolvedExpression}`)(Math);
        evaluatedProcessCosts[key] = resultValue.toString();
      } catch {
        evaluatedProcessCosts[key] = `{ Error: Invalid expression. }`;
      }
    }

    return evaluatedProcessCosts;
  }

  private setProcessCostExpressionParamsForInstance(flowNodeInstance: any): void {
    this.processCostsExpressionParams.currentFlowNode = this.getCurrentFlowNode(flowNodeInstance.flowNodeInstanceId);
    this.processCostsExpressionParams.token = this.buildTokenHistoryForFlowNodeInstance(
      flowNodeInstance.flowNodeInstanceId,
    );
    this.processCostsExpressionParams.dataObjects = this.buildDataObjectsForFlowNodeInstance(
      flowNodeInstance.flowNodeInstanceId,
    );
    this.processCostsExpressionParams.flowNodeExecutionCount = this.getFlowNodeExecutionCount(
      flowNodeInstance.id,
      flowNodeInstance.flowNodeInstanceId,
    );
  }

  private getCurrentFlowNode(flowNodeInstanceId: string): any {
    return this.flowNodeInstances.find((fni) => fni.flowNodeInstanceId === flowNodeInstanceId);
  }

  private buildTokenHistoryForFlowNodeInstance(flowNodeInstanceId: string): {
    current: any;
    history: Record<string, any>;
  } {
    const targetIndex = this.flowNodeInstances.findIndex(
      (fni: any) => fni.flowNodeInstanceId === flowNodeInstanceId && fni.flowNodeExitedAt,
    );

    if (targetIndex === -1) return { current: {}, history: {} };

    const current = this.flowNodeInstances[targetIndex]?.endToken ?? {};
    const history: Record<string, any> = {};

    for (let i = 0; i < targetIndex; i++) {
      const fni = this.flowNodeInstances[i];
      if (fni.endToken) {
        history[fni.id] = fni.endToken;
      }
    }

    return { current, history };
  }

  private buildDataObjectsForFlowNodeInstance(flowNodeInstanceId: string): Record<string, any> {
    const dataObjectValues: Record<string, any> = {};
    for (const fni of this.flowNodeInstances) {
      if (fni.flowNodeInstanceId === flowNodeInstanceId && fni.flowNodeExitedAt) break;
      for (const [key, value] of Object.entries(fni.writtenDataObjectValues || {})) {
        dataObjectValues[key] = value;
      }
    }
    return dataObjectValues;
  }
}
