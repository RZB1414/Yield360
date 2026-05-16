import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPlannerReport,
  normalizeMonthlyContributions,
  normalizePlannerInput
} from '../src/index.js';

function birthDateYearsAgo(age) {
  const today = new Date();
  const year = today.getUTCFullYear() - age;
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function baseInput(overrides = {}) {
  return normalizePlannerInput({
    client: {
      name: 'Cliente Teste',
      birthDate: birthDateYearsAgo(40),
      investorProfile: 'Moderado',
      profession: 'Empresario'
    },
    vision360: {
      assets: {
        items: [{ description: 'Ativos financeiros', value: 100000 }]
      },
      liabilities: {
        items: [{ description: 'Emprestimos', value: 10000 }]
      },
      budget: {
        monthlyIncome: 12000,
        monthlyExpenses: 7000,
        emergencyReserveNeed: 42000,
        emergencyReserveCurrent: 12000
      }
    },
    future: {
      targetAge: 42,
      agreedMonthlyContribution: 1000,
      nominalAnnualRate: 0,
      inflationRate: 0,
      desiredMonthlyRetirementSpend: 6000
    },
    profileValidation: {
      benchmarkRate: 4
    },
    succession: {
      commonAssetsItems: [{ name: 'Imovel comum', value: 40000 }],
      debts: 10000,
      vgbl: 10000,
      lifeInsurance: 5000
    },
    ...overrides
  });
}

describe('planner calculations', () => {
  it('projects accumulation with zero return as principal plus contributions', () => {
    const report = buildPlannerReport(baseInput());

    assert.equal(report.modules.results.contributionYears, 2);
    assert.equal(report.modules.results.totalMonths, 24);
    assert.equal(report.modules.results.currentInvestableAssets, 100000);
    assert.equal(report.modules.results.totalInvested, 124000);
    assert.equal(report.modules.results.futureNominalValue, 124000);
    assert.equal(report.modules.results.futureRealValue, 124000);
    assert.equal(report.modules.results.nominalReturn, 0);
    assert.equal(report.modules.results.realReturn, 0);
  });

  it('calculates succession inventory gap from estate and off-inventory resources', () => {
    const report = buildPlannerReport(baseInput());

    assert.equal(report.modules.overview.netWorth, 90000);
    assert.equal(report.modules.succession.spouseShare, 20000);
    assert.equal(report.modules.succession.privateAssets, 90000);
    assert.equal(report.modules.succession.grossEstate, 110000);
    assert.equal(report.modules.succession.netEstate, 100000);
    assert.equal(report.modules.succession.inventoryCost, 20000);
    assert.equal(report.modules.succession.offInventoryResources, 15000);
    assert.equal(report.modules.succession.additionalNeed, 5000);
  });

  it('normalizes monthly contributions by contribution date and sums them in reports', () => {
    const input = baseInput({
      control: {
        agreedContributionTarget: 12000,
        monthlyContributions: [
          { month: 'Janeiro', amount: 500, date: '2026-03-15' },
          { month: 'Mes 2', amount: 700 }
        ]
      }
    });
    const normalizedContributions = normalizeMonthlyContributions(input.control.monthlyContributions);
    const report = buildPlannerReport(input);

    assert.equal(normalizedContributions[1].amount, 700);
    assert.equal(normalizedContributions[2].amount, 500);
    assert.equal(report.modules.control.totalContributed, 1200);
    assert.equal(report.modules.control.contributedProgress, 10);
    assert.equal(report.modules.control.remainingContributionGap, 10800);
  });
});
