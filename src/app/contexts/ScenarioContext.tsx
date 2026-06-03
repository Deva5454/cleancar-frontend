/**
 * Scenario Context
 * Provides global scenario state for testing and demo purposes
 */

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import type { Scenario, ScenarioData } from "../data/mockScenarios";
import { getScenarioData } from "../data/mockScenarios";

interface ScenarioContextType {
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  scenarioData: ScenarioData;
  isScenarioActive: (scenarioName: Scenario) => boolean;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const scenarioData = useMemo(() => getScenarioData(scenario), [scenario]);

  const isScenarioActive = (scenarioName: Scenario) => scenario === scenarioName;

  const scenarioValue = useMemo(() => ({
    scenario,
    setScenario,
    scenarioData,
    isScenarioActive,
  }),
  [scenario, setScenario, scenarioData, isScenarioActive]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ScenarioContext.Provider
      value={scenarioValue}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (!context) {
    // Return safe defaults when provider is not available
    return {
      scenario: "normal" as Scenario,
      setScenario: () => {},
      scenarioData: getScenarioData("normal"),
      isScenarioActive: (scenarioName: Scenario) => scenarioName === "normal",
    };
  }
  return context;
}

// Optional hook for non-destructive data override
export function useScenarioData<T>(
  dataKey: keyof ScenarioData,
  existingData: T
): T {
  const { scenarioData } = useScenario();
  const override = scenarioData[dataKey];
  return (override ?? existingData) as T;
}
