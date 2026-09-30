const values = {
  travel: {
    taxi: { cost: 30, energy: -3 },
    taxiPassage: { cost: 30, energy: -12, happiness: -5 },
    ehailing: { cost: 110, energy: 2, surgeMultiplier: 1.8 },
    bicycle: { cost: 0, energy: -8, health: 2, rainEnergyMultiplier: 2 },
    car: { fuelCost: 90, energy: 3 },
  },
  assets: {
    bicycle: { purchaseCost: 900 },
    car: {
      purchaseCost: 18_000,
      netWorthRate: 0.85,
      repairMin: 400,
      repairMax: 900,
      driverIncomeMin: 220,
      driverIncomeMax: 450,
    },
  },
  stayHome: {
    energy: 18,
    health: 3,
    corporatePerformance: -2,
    corporateCalledPerformance: -1,
    soloTrust: -4,
    staffedTrust: -2,
    staffedIncomeRate: 0.35,
  },
  business: {
    startingTrust: 55,
    closureDaysAtZeroTrust: 2,
  },
};

function deepFreeze(value) {
  Object.values(value).forEach((child) => {
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  });
  return Object.freeze(value);
}

export const ECONOMY = deepFreeze(values);

export function formatRand(amount) {
  const rounded = Math.round(Number(amount) || 0);
  const sign = rounded < 0 ? "−" : "";
  return sign + "R" + Math.abs(rounded).toLocaleString("en-ZA");
}
