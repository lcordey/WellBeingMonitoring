#!/usr/bin/env node
const { spawn } = require('child_process');

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

async function main() {
  try {
    const results = await runApiTests();
    printSummary(results);
    if (results.some(r => !r.success)) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('\n❌ Test suite failed to run:', error.message);
    process.exitCode = 1;
  }
}

async function runApiTests() {
  const tests = [
    {
      name: 'Create well-being type',
      request: () => postJson('/command/createWBType', {
        category: 'observation',
        type: 'mood',
        allowMultipleSelection: false
      }),
      validate: (response) => validateOk(response, 'Type created successfully')
    },
    {
      name: 'Add well-being value',
      request: () => postJson('/command/addWBValue', {
        type: 'mood',
        value: 'happy',
        notable: true
      }),
      validate: (response) => validateOk(response, 'Value added successfully')
    },
    {
      name: 'Add well-being data entry',
      request: () => postJson('/command/addWBData', {
        data: {
          date: '2024-01-10',
          category: 'observation',
          type: 'mood',
          values: ['happy']
        }
      }),
      validate: (response) => validateOk(response, 'Well-being data stored')
    },
    {
      name: 'Retrieve well-being definitions',
      request: () => postJson('/command/getWBDefinitions', {
        category: 'observation'
      }),
      validate: (response) => {
        if (!response.ok) {
          return failed(`Unexpected status code ${response.status}`);
        }
        if (!Array.isArray(response.data) || response.data.length === 0) {
          return failed('No definitions returned.');
        }
        // Log the definitions found
        // console.log('Definitions returned:', JSON.stringify(response.data, null, 2));
        const mood = response.data.find((item) => item.type?.toLowerCase() === 'mood');
        if (!mood) {
          return failed('Mood type missing from definitions.');
        }
        if (!Array.isArray(mood.values?.values) || mood.values.values.length === 0) {
          return failed('Mood values are missing.');
        }
        return passed('Definitions retrieved successfully');
      }
    },
    {
      name: 'Retrieve well-being values',
      request: () => postJson('/command/getWBValues', {
        type: 'mood'
      }),
      validate: (response) => {
        if (!response.ok) {
          return failed(`Unexpected status code ${response.status}`);
        }
        if (!response.data?.values || response.data.values.length === 0) {
          return failed('No values returned for mood.');
        }
        const happy = response.data.values.find((item) => item.value?.toLowerCase() === 'happy');
        if (!happy) {
          return failed('Expected value "happy" not returned.');
        }
        if (happy.noticeable !== true) {
          return failed('Expected "happy" to be marked as notable.');
        }
        return passed('Values retrieved successfully');
      }
    },
    {
      name: 'Retrieve all well-being data entries',
      request: () => postJson('/command/getAll', {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        categoryAndTypes: [
          { category: 'observation', type: 'mood' }
        ]
      }),
      validate: (response) => {
        if (!response.ok) {
          return failed(`Unexpected status code ${response.status}`);
        }
        if (!Array.isArray(response.data) || response.data.length === 0) {
          return failed('No well-being entries returned.');
        }
        const entry = response.data[0];
        if (!entry.values || entry.values[0]?.toLowerCase() !== 'happy') {
          return failed('Stored well-being entry is missing expected values.');
        }
        return passed('Well-being data retrieved successfully');
      }
    },
    {
      name: 'Delete well-being value',
      request: () => postJson('/command/deleteWBValue', {
        type: 'mood',
        value: 'happy'
      }),
      validate: (response) => validateOk(response, 'Value deleted successfully')
    },
    {
      name: 'Verify values removed',
      request: () => postJson('/command/getWBValues', {
        type: 'mood'
      }),
      validate: (response) => {
        if (!response.ok) {
          return failed(`Unexpected status code ${response.status}`);
        }
        if (Array.isArray(response.data?.values) && response.data.values.length === 0) {
          return passed('Values successfully removed');
        }
        return failed('Values were not removed as expected.');
      }
    },
    {
      name: 'Delete well-being type',
      request: () => postJson('/command/deleteWBType', {
        categoryAndType: {
          category: 'observation',
          type: 'mood'
        }
      }),
      validate: (response) => validateOk(response, 'Type deleted successfully')
    },
    {
      name: 'Verify definitions removed',
      request: () => postJson('/command/getWBDefinitions', {
        category: 'observation'
      }),
      validate: (response) => {
        if (!response.ok) {
          return failed(`Unexpected status code ${response.status}`);
        }
        if (Array.isArray(response.data)) {
          const mood = response.data.find((item) => item.type?.toLowerCase() === 'mood');
          if (!mood) {
            return passed('Mood definition successfully removed');
          }
          return failed('Mood definition was not removed as expected.');
        }
        return failed('Unexpected response format.');
      }
    }
  ];

  const results = [];
  for (const test of tests) {
    try {
      const response = await test.request();
      const validation = await test.validate(response);
      if (validation.success) {
        results.push({ name: test.name, success: true, message: validation.message });
      } else {
        const message = validation.message ?? 'Validation failed';
        results.push({ name: test.name, success: false, message });
      }
    } catch (error) {
      results.push({ name: test.name, success: false, message: error.message });
    }
  }

  return results;
}

async function postJson(path, payload) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let data;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  return { ok: response.ok, status: response.status, data };
}

function validateOk(response, successMessage) {
  if (!response.ok) {
    return failed(`Unexpected status code ${response.status}`);
  }
  return passed(successMessage);
}

function passed(message) {
  return { success: true, message };
}

function failed(message) {
  return { success: false, message };
}

function printSummary(results) {
  console.log('\nTest summary:');
  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name} - ${result.message}`);
  }
}

main();
