# Voice Input System Testing Documentation

This document provides comprehensive guidance for testing the voice input system, including setup, running tests, troubleshooting, and user guides.

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Setup and Installation](#setup-and-installation)
4. [Running Tests](#running-tests)
5. [Test Categories](#test-categories)
6. [User Guides](#user-guides)
7. [Troubleshooting](#troubleshooting)
8. [Continuous Integration](#continuous-integration)
9. [Performance Testing](#performance-testing)
10. [Best Practices](#best-practices)

## Overview

The voice input system includes a comprehensive test suite covering:

- **Unit Tests:** Individual component and hook testing
- **Integration Tests:** Component interaction testing
- **Acceptance Tests:** Real-world scenario testing
- **Compatibility Tests:** Cross-browser and device testing
- **Performance Tests:** Performance benchmarking
- **Accessibility Tests:** WCAG compliance testing

### Test Coverage

| Test Type | Coverage | Files |
|-----------|----------|-------|
| Unit Tests | Components, Hooks, Utils | `src/components/__tests__/`, `src/hooks/__tests__/` |
| Integration Tests | Component Interactions | `src/test/integration/` |
| Acceptance Tests | User Scenarios | `src/test/acceptance/` |
| Compatibility Tests | Browser/Device | `src/test/compatibility/` |
| Performance Tests | Benchmarks | `src/test/performance/` |

## Test Architecture

### Test Framework Stack

```typescript
// Core Testing Framework
- Vitest (Test Runner)
- React Testing Library (Component Testing)
- Jest DOM (Custom Matchers)
- User Event (User Interaction Simulation)

// Browser Environment
- JSDOM (Browser Environment Simulation)
- Custom Mocks (Web APIs, Speech Recognition)

// Coverage & Reporting
- Vitest Coverage (Code Coverage)
- Custom Reporters (Test Results)
```

### Test Structure

```
src/test/
├── setup.ts                    # Global test setup
├── integration/                # Integration tests
├── acceptance/                 # User acceptance tests
├── compatibility/              # Cross-browser tests
├── performance/                # Performance benchmarks
└── utils/                      # Test utilities
```

## Setup and Installation

### Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Git**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd breakfast-club-berlin-fusion

# Install dependencies
npm install

# Install testing dependencies (if not already included)
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Configure environment variables
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPGRAM_API_KEY=your_deepgram_key_here
```

### Test Configuration

The test configuration is defined in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests once
npm test -- --run

# Run tests with UI
npm test -- --ui

# Run tests with coverage
npm test -- --coverage
```

### Running Specific Test Categories

```bash
# Unit tests only
npm test -- --run src/components/__tests__/
npm test -- --run src/hooks/__tests__/

# Integration tests
npm test -- --run src/test/integration/

# Acceptance tests
npm test -- --run src/test/acceptance/

# Compatibility tests
npm test -- --run src/test/compatibility/

# Performance tests
npm test -- --run src/test/performance/
```

### Running Specific Test Files

```bash
# Voice input component tests
npm test -- --run src/components/__tests__/VoiceInput.test.tsx

# Deepgram hook tests
npm test -- --run src/hooks/__tests__/useDeepgram.test.tsx

# Browser compatibility tests
npm test -- --run src/test/compatibility/BrowserCompatibility.test.tsx

# Device compatibility tests
npm test -- --run src/test/compatibility/DeviceCompatibility.test.tsx
```

### Running Tests by Pattern

```bash
# Tests containing "voice"
npm test -- --run -t "voice"

# Tests containing "browser"
npm test -- --run -t "browser"

# Tests containing "mobile"
npm test -- --run -t "mobile"

# Tests containing "accessibility"
npm test -- --run -t "accessibility"
```

### Running Tests with Different Configurations

```bash
# Run tests with verbose output
npm test -- --run --reporter=verbose

# Run tests with minimal output
npm test -- --run --reporter=basic

# Run tests with custom timeout
npm test -- --run --timeout=10000

# Run tests in parallel
npm test -- --run --threads=4
```

## Test Categories

### 1. Unit Tests

Unit tests focus on individual components and hooks in isolation.

#### Component Tests

```typescript
// Example: VoiceInput.test.tsx
describe('VoiceInput', () => {
  it('should render correctly', () => {
    render(<VoiceInput language="en" onResult={mockOnResult} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle speech recognition', async () => {
    // Test speech recognition functionality
  })
})
```

#### Hook Tests

```typescript
// Example: useDeepgram.test.tsx
describe('useDeepgram', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useDeepgram())
    expect(result.current.isConnected).toBe(false)
  })
})
```

### 2. Integration Tests

Integration tests verify how components work together.

```typescript
// Example: VoiceSystem.test.tsx
describe('Voice System Integration', () => {
  it('should handle complete voice workflow', async () => {
    // Test complete voice input workflow
  })
})
```

### 3. Acceptance Tests

Acceptance tests simulate real-world usage scenarios.

```typescript
// Example: VoiceInputAcceptance.test.tsx
describe('Chef Adding New Menu Item', () => {
  it('should allow chef to dictate menu item', async () => {
    // Test chef workflow
  })
})
```

### 4. Compatibility Tests

Compatibility tests ensure cross-browser and device support.

```typescript
// Example: BrowserCompatibility.test.tsx
describe('Chrome Browser Compatibility', () => {
  it('should support speech recognition', () => {
    // Test Chrome-specific functionality
  })
})
```

### 5. Performance Tests

Performance tests measure system performance under various conditions.

```typescript
// Example: Performance.test.tsx
describe('Performance Benchmarks', () => {
  it('should respond within 2 seconds', async () => {
    // Test response time
  })
})
```

## User Guides

### For Developers

#### Setting Up Development Environment

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd breakfast-club-berlin-fusion
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

#### Writing New Tests

1. **Component Test Template**
   ```typescript
   import { render, screen } from '@testing-library/react'
   import { describe, it, expect } from 'vitest'
   import { ComponentName } from '../ComponentName'

   describe('ComponentName', () => {
     it('should render correctly', () => {
       render(<ComponentName />)
       expect(screen.getByRole('button')).toBeInTheDocument()
     })
   })
   ```

2. **Hook Test Template**
   ```typescript
   import { renderHook } from '@testing-library/react'
   import { describe, it, expect } from 'vitest'
   import { useHookName } from '../useHookName'

   describe('useHookName', () => {
     it('should initialize correctly', () => {
       const { result } = renderHook(() => useHookName())
       expect(result.current.value).toBeDefined()
     })
   })
   ```

#### Test Best Practices

1. **Test Structure**
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests focused and isolated

2. **Mocking**
   - Mock external dependencies
   - Use realistic test data
   - Clean up mocks after tests

3. **Assertions**
   - Test behavior, not implementation
   - Use semantic queries
   - Avoid testing implementation details

### For QA Engineers

#### Manual Testing Checklist

1. **Browser Testing**
   - [ ] Chrome (Desktop & Mobile)
   - [ ] Safari (Desktop & iOS)
   - [ ] Firefox (Desktop & Mobile)
   - [ ] Edge (Desktop)

2. **Device Testing**
   - [ ] Mobile (375x667)
   - [ ] Tablet (768x1024)
   - [ ] Desktop (1920x1080)
   - [ ] Large Screen (2560x1440)

3. **Functionality Testing**
   - [ ] Voice input activation
   - [ ] Speech recognition
   - [ ] Error handling
   - [ ] Accessibility features

4. **Performance Testing**
   - [ ] Response time < 2 seconds
   - [ ] Memory usage < 200MB
   - [ ] CPU usage < 50%

#### Test Scenarios

1. **Chef Workflow**
   - Open menu management
   - Click voice input button
   - Dictate menu item description
   - Verify transcription accuracy

2. **Server Workflow**
   - Open order management
   - Use voice input for orders
   - Test order modifications
   - Verify order accuracy

3. **Error Scenarios**
   - Test microphone permission denial
   - Test network connectivity issues
   - Test low confidence speech
   - Test timeout scenarios

### For End Users

#### Getting Started

1. **System Requirements**
   - Modern web browser (Chrome, Safari, Firefox, Edge)
   - Microphone access
   - Stable internet connection
   - JavaScript enabled

2. **First Time Setup**
   - Grant microphone permissions when prompted
   - Allow browser notifications (optional)
   - Test voice input with simple phrases

3. **Basic Usage**
   - Click the microphone button
   - Speak clearly into your microphone
   - Wait for transcription
   - Review and edit if needed

#### Voice Input Tips

1. **Optimal Conditions**
   - Quiet environment
   - Clear speech
   - Proper microphone positioning
   - Stable internet connection

2. **Language Support**
   - English (en-US)
   - German (de-DE)
   - Automatic language detection

3. **Common Commands**
   - "Add new menu item"
   - "Create ingredient list"
   - "Update order"
   - "Cancel recording"

#### Troubleshooting

1. **Microphone Issues**
   - Check browser permissions
   - Test microphone in other applications
   - Restart browser if needed

2. **Recognition Issues**
   - Speak more clearly
   - Reduce background noise
   - Check internet connection
   - Try different phrases

3. **Performance Issues**
   - Close unnecessary browser tabs
   - Restart browser
   - Check system resources
   - Update browser to latest version

## Troubleshooting

### Common Test Issues

#### 1. Test Environment Setup

**Problem:** Tests fail with "Cannot find module" errors
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem:** JSDOM environment issues
```bash
# Solution: Check vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

#### 2. Mock Issues

**Problem:** Speech recognition mocks not working
```typescript
// Solution: Ensure proper mock setup
beforeEach(() => {
  vi.clearAllMocks()
  createMockSpeechRecognition('chrome')
})
```

**Problem:** Browser API mocks failing
```typescript
// Solution: Check mock implementation
Object.defineProperty(window, 'SpeechRecognition', {
  value: vi.fn().mockImplementation(() => mockRecognition),
  writable: true,
})
```

#### 3. Async Test Issues

**Problem:** Tests timing out
```typescript
// Solution: Increase timeout
it('should handle async operation', async () => {
  // Test code
}, 10000) // 10 second timeout
```

**Problem:** Async operations not completing
```typescript
// Solution: Use proper async/await
it('should wait for async operation', async () => {
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

#### 4. Component Rendering Issues

**Problem:** Components not rendering
```typescript
// Solution: Check component imports
import { VoiceInput } from '../VoiceInput'
// Ensure correct path and export
```

**Problem:** Props not being passed correctly
```typescript
// Solution: Verify prop types
render(<VoiceInput language="en" onResult={mockOnResult} />)
```

### Performance Issues

#### 1. Slow Test Execution

**Problem:** Tests running slowly
```bash
# Solution: Run tests in parallel
npm test -- --run --threads=4

# Solution: Run specific test categories
npm test -- --run src/components/__tests__/
```

#### 2. Memory Issues

**Problem:** Tests running out of memory
```bash
# Solution: Increase Node.js memory limit
node --max-old-space-size=4096 node_modules/.bin/vitest --run
```

#### 3. Coverage Issues

**Problem:** Coverage not generating
```bash
# Solution: Check coverage configuration
npm test -- --coverage --reporter=html
```

### Browser-Specific Issues

#### 1. Chrome Issues

**Problem:** Speech recognition not working
```typescript
// Solution: Check Chrome-specific implementation
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
  // Chrome supports both APIs
}
```

#### 2. Safari Issues

**Problem:** Webkit speech recognition failing
```typescript
// Solution: Use webkit-specific API
const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
```

#### 3. Firefox Issues

**Problem:** Speech recognition not available
```typescript
// Solution: Check Firefox support
if (window.SpeechRecognition) {
  // Firefox supports standard API
}
```

## Continuous Integration

### GitHub Actions Configuration

```yaml
name: Voice Input Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm test -- --run src/components/__tests__/
    
    - name: Run integration tests
      run: npm test -- --run src/test/integration/
    
    - name: Run acceptance tests
      run: npm test -- --run src/test/acceptance/
    
    - name: Run compatibility tests
      run: npm test -- --run src/test/compatibility/
    
    - name: Generate coverage report
      run: npm test -- --coverage --reporter=html
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test -- --run src/components/__tests__/",
      "pre-push": "npm test -- --run"
    }
  }
}
```

### Test Reporting

```typescript
// Custom test reporter
export default {
  onCollected(files) {
    console.log(`Tests completed: ${files.length} files`)
  },
  
  onFinished(files) {
    console.log('All tests finished')
  }
}
```

## Performance Testing

### Performance Benchmarks

```typescript
// Performance test example
describe('Performance Benchmarks', () => {
  it('should respond within 2 seconds', async () => {
    const startTime = performance.now()
    
    // Perform voice input operation
    await user.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalled()
    })
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(2000) // 2 seconds
  })
})
```

### Memory Usage Testing

```typescript
// Memory usage test
it('should not exceed memory limit', async () => {
  const initialMemory = performance.memory?.usedJSHeapSize || 0
  
  // Perform memory-intensive operations
  for (let i = 0; i < 100; i++) {
    await user.click(screen.getByRole('button'))
  }
  
  const finalMemory = performance.memory?.usedJSHeapSize || 0
  const memoryIncrease = finalMemory - initialMemory
  
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
})
```

### Load Testing

```typescript
// Load test example
it('should handle concurrent users', async () => {
  const promises = []
  
  // Simulate 10 concurrent users
  for (let i = 0; i < 10; i++) {
    promises.push(
      user.click(screen.getByRole('button'))
    )
  }
  
  await Promise.all(promises)
  
  // Verify all operations completed
  expect(mockOnResult).toHaveBeenCalledTimes(10)
})
```

## Best Practices

### Test Organization

1. **File Naming**
   - Use descriptive names: `VoiceInput.test.tsx`
   - Group related tests: `VoiceSystem.integration.test.tsx`
   - Use consistent patterns

2. **Test Structure**
   ```typescript
   describe('ComponentName', () => {
     beforeEach(() => {
       // Setup
     })
     
     afterEach(() => {
       // Cleanup
     })
     
     describe('Feature', () => {
       it('should behave correctly', () => {
         // Test
       })
     })
   })
   ```

3. **Test Data**
   - Use realistic test data
   - Create reusable test utilities
   - Mock external dependencies

### Code Quality

1. **Test Coverage**
   - Aim for >90% coverage
   - Focus on critical paths
   - Test edge cases

2. **Test Maintainability**
   - Keep tests simple
   - Use descriptive names
   - Avoid test interdependence

3. **Performance**
   - Run tests quickly
   - Use efficient mocks
   - Parallelize when possible

### Documentation

1. **Test Documentation**
   - Document complex test scenarios
   - Explain test data choices
   - Keep documentation updated

2. **User Documentation**
   - Provide clear setup instructions
   - Include troubleshooting guides
   - Update with new features

This comprehensive testing documentation ensures that the voice input system is thoroughly tested, well-documented, and maintainable for all stakeholders. 