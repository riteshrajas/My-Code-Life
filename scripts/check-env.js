#!/usr/bin/env node
// filepath: p:\PERSONAL\Stage\stage\scripts\check-env.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define the required environment variables
const requiredEnvVars = {
  VITE_SUPABASE_URL: 'Your Supabase URL (e.g., https://your-project.supabase.co)',
  VITE_SUPABASE_ANON_KEY: 'Your Supabase anon key (found in Project Settings > API)',
  VITE_GEMINI_API_KEY: 'Your Gemini API key (optional)'
};

// Define the path to the .env file
const envFilePath = path.join(__dirname, '..', '.env');

// Check if .env file exists
const checkEnvFile = () => {
  try {
    if (!fs.existsSync(envFilePath)) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️  No .env file found. Creating one now...');
      return createEnvFile();
    } else {
      console.log('\x1b[32m%s\x1b[0m', '✅ .env file exists. Checking for required variables...');
      return checkEnvVariables();
    }
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error checking .env file:', err);
    return Promise.reject(err);
  }
};

// Create a new .env file
const createEnvFile = () => {
  return collectEnvVariables()
    .then((envVars) => {
      const envFileContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync(envFilePath, envFileContent);
      console.log('\x1b[32m%s\x1b[0m', '✅ .env file created successfully!');
    })
    .catch((err) => {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error creating .env file:', err);
    });
};

// Check if all required environment variables are present
const checkEnvVariables = () => {
  try {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const envLines = envContent.split('\n');
    const existingEnvVars = {};
    
    envLines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        existingEnvVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    const missingVars = [];
    
    Object.keys(requiredEnvVars).forEach(key => {
      if (!existingEnvVars[key] || existingEnvVars[key] === 'your-supabase-url' || existingEnvVars[key] === 'your-supabase-anon-key') {
        missingVars.push(key);
      }
    });
    
    if (missingVars.length > 0) {
      console.log('\x1b[33m%s\x1b[0m', `⚠️  Missing environment variables: ${missingVars.join(', ')}`);
      return promptForMissingVars(missingVars, existingEnvVars);
    } else {
      console.log('\x1b[32m%s\x1b[0m', '✅ All required environment variables are set!');
      return Promise.resolve();
    }
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error checking environment variables:', err);
    return Promise.reject(err);
  }
};

// Prompt for missing environment variables
const promptForMissingVars = (missingVars, existingEnvVars) => {
  const updatedEnvVars = { ...existingEnvVars };
  
  return missingVars.reduce((promise, key) => {
    return promise.then(() => {
      return new Promise((resolve) => {
        rl.question(`Enter ${requiredEnvVars[key]}: `, (answer) => {
          updatedEnvVars[key] = answer;
          resolve();
        });
      });
    });
  }, Promise.resolve())
    .then(() => {
      const envFileContent = Object.entries(updatedEnvVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync(envFilePath, envFileContent);
      console.log('\x1b[32m%s\x1b[0m', '✅ .env file updated successfully!');
      rl.close();
    });
};

// Collect all required environment variables
const collectEnvVariables = () => {
  const envVars = {};
  const keys = Object.keys(requiredEnvVars);
  
  return keys.reduce((promise, key) => {
    return promise.then(() => {
      return new Promise((resolve) => {
        rl.question(`Enter ${requiredEnvVars[key]}: `, (answer) => {
          envVars[key] = answer;
          resolve();
        });
      });
    });
  }, Promise.resolve())
    .then(() => {
      rl.close();
      return envVars;
    });
};

// Run the script
checkEnvFile()
  .then(() => {
    console.log('\x1b[36m%s\x1b[0m', 'Environment setup completed! You can now start the development server.');
    process.exit(0);
  })
  .catch(() => {
    rl.close();
    process.exit(1);
  });
