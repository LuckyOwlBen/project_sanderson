#!/usr/bin/env node

/**
 * Simple test runner for backend integration
 * Runs as a standalone Node process
 */

// Test single attack
async function testAttack() {
  console.log('\nTesting backend API...\n');
  
  try {
    const body = JSON.stringify({
      skillTotal: 8,
      bonusModifiers: 2,
      damageNotation: 'd6+1',
      damageBonus: 0,
      targetDefense: 12,
      advantageMode: 'normal'
    });

    const response = await fetch('http://localhost:3000/api/calculations/attack/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      const text = await response.text();
      console.error('Response:', text);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✓ API Response received:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.attack) {
      console.log('\n✓ Attack roll successful!');
      console.log(`  d20 Roll: ${data.attack.attackRoll.finalRoll}`);
      console.log(`  Total Attack: ${data.attack.attackRoll.total}`);
      console.log(`  vs Defense: ${data.attack.combat.vsDefense}`);
      console.log(`  Result: ${data.attack.combat.isHit ? 'HIT' : 'MISS'}`);
      if (data.attack.combat.isHit) {
        console.log(`  Damage: ${data.attack.combat.damageDealt}`);
      }
      process.exit(0);
    } else {
      console.error('API error:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Connection error:', error.message);
    console.error('\n⚠️ Backend server is not responding on http://localhost:3000');
    console.error('Make sure the server is running: cd server && npm start');
    process.exit(1);
  }
}

testAttack();
