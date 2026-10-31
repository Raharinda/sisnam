export function periodEnergy(currentEnergy: number, baselineEnergy: number) {
  const difference = currentEnergy - baselineEnergy;
  return Number.isFinite(difference) && difference >= 0 ? difference : 0;
}

export function calculateCost(energyKwh: number, tariff: number) {
  return periodEnergy(energyKwh, 0) * Math.max(0, Number(tariff) || 0);
}

export function calculateEmission(energyKwh: number, emissionFactor: number) {
  return periodEnergy(energyKwh, 0) * Math.max(0, Number(emissionFactor) || 0);
}

export function estimateMonthlyCost(powerWatts: number, tariff: number) {
  const power = Math.max(0, Number(powerWatts) || 0);
  return (power / 1000) * 24 * 30 * Math.max(0, Number(tariff) || 0);
}
