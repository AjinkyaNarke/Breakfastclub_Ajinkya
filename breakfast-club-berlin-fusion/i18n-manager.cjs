#!/usr/bin/env node

/**
 * Custom i18n Management Tool for Restaurant Management System
 * Helps identify missing translations and manage German/English workflow
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = './public/locales';
const SOURCE_LANG = 'en';
const TARGET_LANG = 'de';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
}

function unflattenObject(obj) {
  const unflattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const keys = key.split('.');
      let current = unflattened;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k]) {
          current[k] = {};
        }
        current = current[k];
      }
      
      current[keys[keys.length - 1]] = obj[key];
    }
  }
  
  return unflattened;
}

function getTranslationFiles() {
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG);
  const targetDir = path.join(LOCALES_DIR, TARGET_LANG);
  
  if (!fs.existsSync(sourceDir)) {
    log(`❌ Source language directory not found: ${sourceDir}`, 'red');
    return [];
  }
  
  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      sourcePath: path.join(sourceDir, file),
      targetPath: path.join(targetDir, file)
    }));
  
  return files;
}

function analyzeTranslations() {
  logHeader('Translation Analysis Report');
  
  const files = getTranslationFiles();
  if (files.length === 0) {
    log('❌ No translation files found!', 'red');
    return;
  }
  
  let totalKeys = 0;
  let missingKeys = 0;
  let orphanedKeys = 0;
  
  files.forEach(file => {
    logSection(`File: ${file.name}`);
    
    const sourceData = loadJsonFile(file.sourcePath);
    const targetData = loadJsonFile(file.targetPath);
    
    if (!sourceData) {
      log(`❌ Could not load source file: ${file.sourcePath}`, 'red');
      return;
    }
    
    const sourceFlat = flattenObject(sourceData);
    const targetFlat = targetData ? flattenObject(targetData) : {};
    
    const sourceKeys = Object.keys(sourceFlat);
    const targetKeys = Object.keys(targetFlat);
    
    const missing = sourceKeys.filter(key => !targetKeys.includes(key));
    const orphaned = targetKeys.filter(key => !sourceKeys.includes(key));
    
    totalKeys += sourceKeys.length;
    missingKeys += missing.length;
    orphanedKeys += orphaned.length;
    
    log(`📊 Total keys: ${sourceKeys.length}`, 'cyan');
    log(`✅ Translated: ${sourceKeys.length - missing.length}`, 'green');
    log(`❌ Missing: ${missing.length}`, 'red');
    log(`⚠️  Orphaned: ${orphaned.length}`, 'yellow');
    
    if (missing.length > 0) {
      log('\n🔍 Missing translations:', 'yellow');
      missing.forEach(key => {
        log(`   • ${key}: "${sourceFlat[key]}"`, 'yellow');
      });
    }
    
    if (orphaned.length > 0) {
      log('\n🗑️  Orphaned translations:', 'magenta');
      orphaned.forEach(key => {
        log(`   • ${key}: "${targetFlat[key]}"`, 'magenta');
      });
    }
  });
  
  logSection('Summary');
  const completionRate = totalKeys > 0 ? ((totalKeys - missingKeys) / totalKeys * 100).toFixed(1) : 0;
  log(`📈 Overall completion: ${completionRate}%`, completionRate >= 90 ? 'green' : completionRate >= 70 ? 'yellow' : 'red');
  log(`📊 Total keys: ${totalKeys}`, 'cyan');
  log(`❌ Missing translations: ${missingKeys}`, 'red');
  log(`⚠️  Orphaned keys: ${orphanedKeys}`, 'yellow');
}

function generateMissingTranslations() {
  logHeader('Generating Missing Translation Template');
  
  const files = getTranslationFiles();
  if (files.length === 0) {
    log('❌ No translation files found!', 'red');
    return;
  }
  
  files.forEach(file => {
    logSection(`Processing: ${file.name}`);
    
    const sourceData = loadJsonFile(file.sourcePath);
    const targetData = loadJsonFile(file.targetPath);
    
    if (!sourceData) {
      log(`❌ Could not load source file: ${file.sourcePath}`, 'red');
      return;
    }
    
    const sourceFlat = flattenObject(sourceData);
    const targetFlat = targetData ? flattenObject(targetData) : {};
    
    const missing = Object.keys(sourceFlat).filter(key => !targetFlat[key]);
    
    if (missing.length === 0) {
      log(`✅ All translations complete for ${file.name}`, 'green');
      return;
    }
    
    // Create template with missing translations
    const template = {};
    missing.forEach(key => {
      template[key] = `[TODO: Translate "${sourceFlat[key]}"]`;
    });
    
    const templatePath = `./missing-translations-${file.name}`;
    if (saveJsonFile(templatePath, template)) {
      log(`📝 Template created: ${templatePath}`, 'green');
      log(`📋 Missing keys: ${missing.length}`, 'yellow');
    } else {
      log(`❌ Failed to create template: ${templatePath}`, 'red');
    }
  });
}

function validateTranslations() {
  logHeader('Translation Validation');
  
  const files = getTranslationFiles();
  if (files.length === 0) {
    log('❌ No translation files found!', 'red');
    return;
  }
  
  let issues = 0;
  
  files.forEach(file => {
    logSection(`Validating: ${file.name}`);
    
    const sourceData = loadJsonFile(file.sourcePath);
    const targetData = loadJsonFile(file.targetPath);
    
    if (!sourceData) {
      log(`❌ Could not load source file: ${file.sourcePath}`, 'red');
      issues++;
      return;
    }
    
    if (!targetData) {
      log(`❌ Target file missing: ${file.targetPath}`, 'red');
      issues++;
      return;
    }
    
    const sourceFlat = flattenObject(sourceData);
    const targetFlat = flattenObject(targetData);
    
    // Check for TODO placeholders
    const todoKeys = Object.keys(targetFlat).filter(key => 
      targetFlat[key].includes('[TODO:') || 
      targetFlat[key].includes('TODO:') ||
      targetFlat[key].trim() === ''
    );
    
    if (todoKeys.length > 0) {
      log(`⚠️  Found ${todoKeys.length} TODO placeholders:`, 'yellow');
      todoKeys.forEach(key => {
        log(`   • ${key}: "${targetFlat[key]}"`, 'yellow');
      });
      issues += todoKeys.length;
    } else {
      log(`✅ No TODO placeholders found`, 'green');
    }
    
    // Check for orphaned keys
    const orphaned = Object.keys(targetFlat).filter(key => !sourceFlat[key]);
    if (orphaned.length > 0) {
      log(`⚠️  Found ${orphaned.length} orphaned keys:`, 'yellow');
      orphaned.forEach(key => {
        log(`   • ${key}: "${targetFlat[key]}"`, 'yellow');
      });
      issues += orphaned.length;
    }
  });
  
  logSection('Validation Summary');
  if (issues === 0) {
    log('✅ All translations validated successfully!', 'green');
  } else {
    log(`⚠️  Found ${issues} issues that need attention`, 'yellow');
  }
}

function showHelp() {
  logHeader('i18n Management Tool - Help');
  
  log('Available commands:', 'bright');
  log('  analyze     - Show translation analysis report', 'cyan');
  log('  generate    - Generate missing translation templates', 'cyan');
  log('  validate    - Validate existing translations', 'cyan');
  log('  help        - Show this help message', 'cyan');
  
  log('\nExamples:', 'bright');
  log('  node i18n-manager.js analyze', 'green');
  log('  node i18n-manager.js generate', 'green');
  log('  node i18n-manager.js validate', 'green');
  
  log('\nConfiguration:', 'bright');
  log(`  Source language: ${SOURCE_LANG}`, 'cyan');
  log(`  Target language: ${TARGET_LANG}`, 'cyan');
  log(`  Locales directory: ${LOCALES_DIR}`, 'cyan');
}

// Main execution
const command = process.argv[2] || 'help';

switch (command) {
  case 'analyze':
    analyzeTranslations();
    break;
  case 'generate':
    generateMissingTranslations();
    break;
  case 'validate':
    validateTranslations();
    break;
  case 'help':
  default:
    showHelp();
    break;
} 