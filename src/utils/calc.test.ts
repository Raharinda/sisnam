import { calculateCost, calculateEmission, estimateMonthlyCost, periodEnergy } from "./calc";

export function runCalculationTests() {
  if (periodEnergy(12, 10) !== 2) throw new Error("periodEnergy gagal");
  if (calculateCost(2, 1444.7) !== 2889.4) throw new Error("calculateCost gagal");
  if (calculateEmission(2, 0.87) !== 1.74) throw new Error("calculateEmission gagal");
  if (estimateMonthlyCost(100, 1000) !== 72000) throw new Error("estimateMonthlyCost gagal");
}
