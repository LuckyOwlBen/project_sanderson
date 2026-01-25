#!/usr/bin/env node

/**
 * Direct Integration Test
 * Runs against the backend API without requiring the frontend test framework
 */

const API_BASE = 'http://localhost:3000/api';

const results = [];

async function apiCall(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    console.log(`✓ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, duration, error: error.message });
    console.log(`✗ ${name} (${duration}ms)`);
    console.log(`  Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n=== Backend-Frontend Integration Tests ===\n');

  // Test 1: Single attack roll
  await test('Single attack roll', async () => {
    const response = await apiCall('/calculations/attack/execute', {
      skillTotal: 8,
      bonusModifiers: 2,
      damageNotation: 'd6+1',
      damageBonus: 0,
      targetDefense: 12,
      advantageMode: 'normal',
    });

    if (!response.success || !response.attack) {
      throw new Error('No attack in response');
    }

    const attack = response.attack;
    if (attack.attackRoll.finalRoll < 1 || attack.attackRoll.finalRoll > 20) {
      throw new Error(`Invalid d20 roll: ${attack.attackRoll.finalRoll}`);
    }

    if (attack.attackRoll.total !== 
        attack.attackRoll.finalRoll + attack.attackRoll.skillModifier + attack.attackRoll.bonusModifiers) {
      throw new Error('Attack total calculation mismatch');
    }

    console.log(
      `    Roll: ${attack.attackRoll.finalRoll} + ${attack.attackRoll.skillModifier} + ${attack.attackRoll.bonusModifiers} = ${attack.attackRoll.total} vs ${attack.combat.vsDefense} -> ${attack.combat.isHit ? 'HIT' : 'MISS'}`
    );
  });

  // Test 2: Advantage rolls
  await test('Advantage rolls (2d20 best)', async () => {
    const response = await apiCall('/calculations/attack/execute', {
      skillTotal: 10,
      bonusModifiers: 0,
      damageNotation: 'd8',
      damageBonus: 0,
      targetDefense: 14,
      advantageMode: 'advantage',
    });

    const attack = response.attack;
    if (attack.attackRoll.rollsGenerated.length !== 2) {
      throw new Error(`Expected 2 rolls, got ${attack.attackRoll.rollsGenerated.length}`);
    }

    const best = Math.max(...attack.attackRoll.rollsGenerated);
    if (attack.attackRoll.finalRoll !== best) {
      throw new Error(`Advantage should keep best roll: expected ${best}, got ${attack.attackRoll.finalRoll}`);
    }

    console.log(`    Rolls: [${attack.attackRoll.rollsGenerated.join(', ')}], Kept: ${attack.attackRoll.finalRoll} (best)`);
  });

  // Test 3: Disadvantage rolls
  await test('Disadvantage rolls (2d20 worst)', async () => {
    const response = await apiCall('/calculations/attack/execute', {
      skillTotal: 10,
      bonusModifiers: 0,
      damageNotation: 'd8',
      damageBonus: 0,
      targetDefense: 14,
      advantageMode: 'disadvantage',
    });

    const attack = response.attack;
    if (attack.attackRoll.rollsGenerated.length !== 2) {
      throw new Error(`Expected 2 rolls, got ${attack.attackRoll.rollsGenerated.length}`);
    }

    const worst = Math.min(...attack.attackRoll.rollsGenerated);
    if (attack.attackRoll.finalRoll !== worst) {
      throw new Error(`Disadvantage should keep worst roll: expected ${worst}, got ${attack.attackRoll.finalRoll}`);
    }

    console.log(`    Rolls: [${attack.attackRoll.rollsGenerated.join(', ')}], Kept: ${attack.attackRoll.finalRoll} (worst)`);
  });

  // Test 4: Attack combinations
  await test('Attack combination (3 attacks)', async () => {
    const response = await apiCall('/calculations/attack/combination', {
      attackCount: 3,
      skillTotal: 8,
      bonusModifiers: 2,
      damageNotation: 'd6+1',
      damageBonus: 0,
      targetDefense: 12,
      advantageMode: 'normal',
    });

    if (!response.combination || response.combination.attacks.length !== 3) {
      throw new Error('Expected 3 attacks in combination');
    }

    const summary = response.combination.summary;
    if (summary.hitCount + summary.missCount !== 3) {
      throw new Error('Hit count + miss count should equal total attacks');
    }

    console.log(`    Attacks: 3, Hits: ${summary.hitCount}, Misses: ${summary.missCount}, Total Damage: ${summary.totalDamage}`);
  });

  // Test 5: Validation - valid parameters
  await test('Validation: valid parameters', async () => {
    const response = await apiCall('/calculations/attack/validate', {
      skillTotal: 8,
      bonusModifiers: 2,
      damageNotation: 'd6+1',
      damageBonus: 0,
      targetDefense: 12,
    });

    if (!response.success || !response.validation.isValid) {
      throw new Error('Valid parameters should pass validation');
    }
  });

  // Test 6: Validation - invalid damage notation
  await test('Validation: invalid damage notation rejection', async () => {
    const response = await apiCall('/calculations/attack/validate', {
      skillTotal: 8,
      bonusModifiers: 2,
      damageNotation: 'invalid-notation',
      damageBonus: 0,
      targetDefense: 12,
    });

    if (response.success) {
      throw new Error('Invalid damage notation should fail validation');
    }
  });

  // Test 7: Validation - negative skill total
  await test('Validation: negative skill total rejection', async () => {
    const response = await apiCall('/calculations/attack/validate', {
      skillTotal: -5,
      bonusModifiers: 2,
      damageNotation: 'd6+1',
      damageBonus: 0,
      targetDefense: 12,
    });

    if (response.success) {
      throw new Error('Negative skill total should fail validation');
    }
  });

  // Test 8: Multiple damage dice
  await test('Complex damage notation (2d6+3)', async () => {
    const response = await apiCall('/calculations/attack/execute', {
      skillTotal: 10,
      bonusModifiers: 1,
      damageNotation: '2d6+3',
      damageBonus: 2,
      targetDefense: 11,
      advantageMode: 'normal',
    });

    const attack = response.attack;
    if (attack.damageRoll.diceNotation !== '2d6+3') {
      throw new Error(`Damage notation mismatch: expected '2d6+3', got '${attack.damageRoll.diceNotation}'`);
    }

    if (attack.damageRoll.diceRolls.length !== 2) {
      throw new Error(`Expected 2 dice rolls for 2d6, got ${attack.damageRoll.diceRolls.length}`);
    }

    const expected = Math.max(attack.damageRoll.diceTotal + 3 + 2 * (attack.combat.isCritical ? 2 : 1), 0);
    if (attack.combat.isHit && attack.damageRoll.total !== attack.damageRoll.diceTotal + attack.damageRoll.bonuses) {
      throw new Error('Damage total calculation mismatch');
    }

    console.log(`    Dice: [${attack.damageRoll.diceRolls.join(', ')}] + 3 + 2 = ${attack.damageRoll.total}`);
  });

  // Test 9: Performance test
  await test('Performance: rapid sequential requests (10 attacks)', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        apiCall('/calculations/attack/execute', {
          skillTotal: 8,
          bonusModifiers: 2,
          damageNotation: 'd6+1',
          damageBonus: 0,
          targetDefense: 12,
          advantageMode: 'normal',
        })
      );
    }

    const results = await Promise.all(promises);
    if (results.length !== 10 || !results.every((r: any) => r.success)) {
      throw new Error('Not all requests completed successfully');
    }

    console.log(`    Completed 10 requests successfully`);
  });

  // Test 10: Extreme values
  await test('Extreme values handling', async () => {
    const response = await apiCall('/calculations/attack/execute', {
      skillTotal: 100,
      bonusModifiers: 50,
      damageNotation: 'd20+10',
      damageBonus: 20,
      targetDefense: 200,
      advantageMode: 'normal',
    });

    if (!response.success) {
      throw new Error('Extreme values should be handled');
    }

    console.log(
      `    Skill 100, Bonus 50, vs Defense 200 -> Attack Total: ${response.attack.combat.attackTotal}`
    );
  });

  // Print summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);

  if (failed > 0) {
    console.log('\n=== Failed Tests ===');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`\n${r.name}`);
        console.log(`  ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
