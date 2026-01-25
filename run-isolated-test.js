#!/usr/bin/env node

/**
 * Start server, wait, then test
 */

const { spawn } = require('child_process');
const fs = require('fs');

const logFile = 'test-results.log';

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  log('\n=== Backend API Integration Test ===\n');
  log(`Started at: ${new Date().toISOString()}`);

  try {
    log('\nAttempting to connect to http://localhost:3000/api...');

    const body = JSON.stringify({
      skillTotal: 8,
      bonusModifiers: 2,
      damageNotation: 'd6+1',
      damageBonus: 0,
      targetDefense: 12,
      advantageMode: 'normal'
    });

    log(`Request body: ${body}`);

    const response = await fetch('http://localhost:3000/api/calculations/attack/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body,
      timeout: 5000
    });

    log(`Response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      log(`HTTP Error: ${error}`);
      process.exit(1);
    }

    const data = await response.json();

    log('\n✓ API Response received!');
    log(JSON.stringify(data, null, 2));

    if (data.success && data.attack) {
      log('\n✓✓✓ Attack roll successful! ✓✓✓');
      log(`  d20 Roll: ${data.attack.attackRoll.finalRoll}`);
      log(`  Total Attack: ${data.attack.attackRoll.total}`);
      log(`  vs Defense: ${data.attack.combat.vsDefense}`);
      log(`  Result: ${data.attack.combat.isHit ? 'HIT' : 'MISS'}`);
      if (data.attack.combat.isHit) {
        log(`  Damage: ${data.attack.combat.damageDealt}`);
      }
      log(`\nCompleted at: ${new Date().toISOString()}`);
      process.exit(0);
    } else {
      log(`API error: ${data.error}`);
      process.exit(1);
    }
  } catch (error) {
    log(`\nConnection error: ${error.message}`);
    log('\n⚠️ Backend server is not responding on http://localhost:3000');
    log('Make sure the server is running in another terminal: cd server && npm start');
    log(`\nFailed at: ${new Date().toISOString()}`);
    process.exit(1);
  }
}

runTest();
