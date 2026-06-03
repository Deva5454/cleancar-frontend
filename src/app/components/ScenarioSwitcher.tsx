/**
 * Scenario Switcher Component
 * Non-intrusive dropdown for switching between demo scenarios
 */

import { useScenario } from "../contexts/ScenarioContext";
import { SCENARIOS, type Scenario } from "../data/mockScenarios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function ScenarioSwitcher() {
  const { scenario, setScenario } = useScenario();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 hidden md:inline">Demo:</span>
      <Select value={scenario} onValueChange={(value) => setScenario(value as Scenario)}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCENARIOS.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              <span className="flex items-center gap-2">
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
