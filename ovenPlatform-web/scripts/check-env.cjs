#!/usr/bin/env node

/**
 * Script to verify and validate environment configurations
 * 
 * This script checks:
 * 1. The presence of required .env files
 * 2. The validity of necessary environment variables based on the current NODE_ENV
 * 3. Potential configuration issues
 * 
 * Version: 1.1.2
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Terminal colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Determine current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Define the base directory
const baseDir = path.resolve(__dirname, '..');

// Required environment variables for each environment
const requiredVars = {
  base: [
    'VITE_APP_NAME'
  ],
  development: [
    'VITE_WEBRTC_URL_BASE',
    'VITE_LLHLS_URL_BASE',
    'VITE_TURN_SERVER_URL_UDP',
    'VITE_TURN_SERVER_URL_TCP',
    'VITE_TURN_SERVER_USERNAME',
    'VITE_TURN_SERVER_CREDENTIAL'
  ],
  production: [
    'VITE_WEBRTC_URL_BASE',
    'VITE_LLHLS_URL_BASE',
    'VITE_TURN_SERVER_URL_UDP',
    'VITE_TURN_SERVER_URL_TCP',
    'VITE_TURN_SERVER_USERNAME',
    'VITE_TURN_SERVER_CREDENTIAL'
  ]
};

// Files to check based on environment
let envFiles = [
  { name: '.env', required: true }
];

// Add environment-specific files based on NODE_ENV
if (NODE_ENV === 'development') {
  envFiles.push({ name: '.env.development', required: false });
  envFiles.push({ name: '.env.local', required: false });
} else if (NODE_ENV === 'production') {
  envFiles.push({ name: '.env.production', required: true });
}

// Check for the presence of environment files
console.log(`${colors.bold}${colors.blue}=== Environment Configuration File Check (${NODE_ENV}) ===${colors.reset}\n`);

let allFilesValid = true;
let allVarsValid = true;

// Check file presence
envFiles.forEach(file => {
  const filePath = path.join(baseDir, file.name);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`${colors.green}✓ ${file.name} found${colors.reset}`);
  } else if (file.required) {
    console.log(`${colors.red}✗ ${file.name} MISSING (required)${colors.reset}`);
    allFilesValid = false;
  } else {
    console.log(`${colors.yellow}○ ${file.name} not found (optional)${colors.reset}`);
  }
});

console.log('');

// Load .env files
const envBase = dotenv.config({ path: path.join(baseDir, '.env') }).parsed || {};
const envDev = {
  ...envBase,
  ...dotenv.config({ path: path.join(baseDir, '.env.development') }).parsed || {}
};
const envProd = {
  ...envBase,
  ...dotenv.config({ path: path.join(baseDir, '.env.production') }).parsed || {}
};

// Function to validate environment variables
function checkEnvVars(env, vars, envName) {
  console.log(`${colors.bold}${colors.blue}Checking variables for: ${envName}${colors.reset}`);
  
  let allValid = true;
  
  // Check required variables
  vars.forEach(variable => {
    if (env[variable]) {
      console.log(`${colors.green}✓ ${variable}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${variable} MISSING${colors.reset}`);
      allValid = false;
    }
  });
  
  return allValid;
}

// Validate base variables
const baseVarsValid = checkEnvVars(envBase, requiredVars.base, 'Base (.env)');
console.log('');

// Only validate development variables in development mode
let devVarsValid = true;
if (NODE_ENV === 'development') {
  devVarsValid = checkEnvVars(envDev, requiredVars.development, 'Development (.env.development)');
  console.log('');
}

// Only validate production variables in production mode
let prodVarsValid = true;
if (NODE_ENV === 'production') {
  prodVarsValid = checkEnvVars(envProd, requiredVars.production, 'Production (.env.production)');
  console.log('');
}

// Additional checks and warnings
console.log(`${colors.bold}${colors.blue}=== Additional Checks ===${colors.reset}\n`);

// Validate URLs
function checkUrl(url, name, envType) {
  if (!url) return;
  
  // Check if the URL seems valid
  if (url.includes('localhost') && envType === 'production') {
    console.log(`${colors.yellow}⚠ ${name} (${envType}) uses 'localhost': ${url}${colors.reset}`);
  } else if ((url.startsWith('http://') || url.startsWith('ws://')) && envType === 'production') {
    console.log(`${colors.yellow}⚠ ${name} (${envType}) uses an insecure protocol: ${url}${colors.reset}`);
  }
}

// Check URLs in production
checkUrl(envProd.VITE_WEBRTC_URL_BASE, 'VITE_WEBRTC_URL_BASE', 'production');
checkUrl(envProd.VITE_LLHLS_URL_BASE, 'VITE_LLHLS_URL_BASE', 'production');
checkUrl(envProd.VITE_API_URL, 'VITE_API_URL', 'production');

// Final status
const allValid = allFilesValid && baseVarsValid && 
  (NODE_ENV === 'development' ? devVarsValid : true) && 
  (NODE_ENV === 'production' ? prodVarsValid : true);

console.log('\n');
if (allValid) {
  console.log(`${colors.bold}${colors.green}✓ All configurations appear valid for ${NODE_ENV} environment!${colors.reset}`);
} else {
  console.log(`${colors.bold}${colors.red}✗ There are issues with the configurations for ${NODE_ENV} environment. Please resolve the indicated errors.${colors.reset}`);
}

process.exit(allValid ? 0 : 1);
