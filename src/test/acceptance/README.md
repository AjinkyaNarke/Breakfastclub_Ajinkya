# Voice Input User Acceptance Tests

This directory contains comprehensive user acceptance tests for the voice input system, designed to simulate real-world usage scenarios in restaurant environments.

## Overview

The acceptance tests cover 8 major scenarios that restaurant staff would encounter when using the voice input system:

1. **Chef Adding New Menu Items** - Complete menu item creation workflows
2. **Kitchen Staff in Noisy Environments** - Handling low confidence and retry scenarios
3. **Server Taking Customer Orders** - Quick order processing and modifications
4. **Manager Creating Special Menu Items** - Complex ingredient lists and dietary information
5. **Error Recovery and Edge Cases** - Graceful handling of failures
6. **Multi-language Support** - German/English switching and mixed content
7. **Accessibility and Usability** - Keyboard navigation and screen reader support
8. **Performance and Reliability** - Stress testing and concurrent usage

## Test Files

### VoiceInputAcceptance.test.tsx
Contains 8 scenario-based test suites with 40+ individual test cases covering:

- **Scenario 1: Chef Adding New Menu Item**
  - Complete menu item description dictation
  - German menu item dictation
  - Complex dish descriptions

- **Scenario 2: Kitchen Staff in Noisy Environment**
  - Low confidence speech handling
  - Automatic retry on no-speech errors
  - Feedback for noisy conditions

- **Scenario 3: Server Taking Customer Orders**
  - Quick order dictation with multiple items
  - Order modification handling
  - Fast-paced order processing

- **Scenario 4: Manager Creating Special Menu Items**
  - Complex ingredient lists
  - Dietary restrictions and allergens
  - Special preparation instructions

- **Scenario 5: Error Recovery and Edge Cases**
  - Microphone permission denial
  - Network connectivity issues
  - Very long transcriptions

- **Scenario 6: Multi-language Support**
  - German/English language switching
  - Mixed language content handling
  - Seamless language transitions

- **Scenario 7: Accessibility and Usability**
  - Full keyboard accessibility
  - Visual feedback for all states
  - Screen reader announcements

- **Scenario 8: Performance and Reliability**
  - Rapid start/stop cycles
  - State consistency during errors
  - Performance under stress

### VoiceWorkflowAcceptance.test.tsx
Contains 8 workflow-based test suites covering complete end-to-end processes:

- **Workflow 1: Complete Menu Item Creation**
  - Full menu item creation process
  - German menu item creation
  - Step-by-step validation

- **Workflow 2: Ingredient Management**
  - Ingredient list creation
  - Ingredient categorization
  - Bulk ingredient processing

- **Workflow 3: Order Processing**
  - Customer order workflow
  - Order modification workflow
  - Real-time order updates

- **Workflow 4: Error Recovery**
  - Error recovery workflow
  - Network failure recovery
  - Graceful degradation

- **Workflow 5: Multi-step Process**
  - Multi-step menu creation
  - Status transitions
  - Progressive workflow validation

- **Workflow 6: Performance and Stress Testing**
  - Rapid workflow execution
  - Concurrent workflow execution
  - Performance benchmarking

- **Workflow 7: Accessibility Workflow**
  - Keyboard-only workflow
  - Screen reader workflow
  - Accessibility compliance

- **Workflow 8: Integration Workflow**
  - Complete integration testing
  - Data persistence workflow
  - System integration validation

## Running the Tests

### Prerequisites
Ensure you have the testing dependencies installed:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Run All Acceptance Tests
```bash
npm test -- --run src/test/acceptance/
```

### Run Specific Test File
```bash
# Run only voice input acceptance tests
npm test -- --run src/test/acceptance/VoiceInputAcceptance.test.tsx

# Run only workflow acceptance tests
npm test -- --run src/test/acceptance/VoiceWorkflowAcceptance.test.tsx
```

### Run Specific Scenario
```bash
# Run only chef scenarios
npm test -- --run -t "Chef Adding New Menu Item"

# Run only error recovery scenarios
npm test -- --run -t "Error Recovery and Edge Cases"
```

### Run with Coverage
```bash
npm test -- --run --coverage src/test/acceptance/
```

## Test Scenarios Explained

### Real-World Usage Patterns

#### 1. Chef Workflow
**Context:** Chef needs to quickly add new menu items during service
**Test Focus:**
- Complete menu item descriptions
- Ingredient lists
- Preparation instructions
- German language support

**Example Test Case:**
```typescript
it('should allow chef to dictate a complete menu item description', async () => {
  // Simulates chef dictating: "Grilled salmon with roasted vegetables and lemon butter sauce"
  // Verifies accurate transcription and processing
})
```

#### 2. Kitchen Staff Workflow
**Context:** Kitchen staff working in noisy environment
**Test Focus:**
- Low confidence speech handling
- Automatic retry mechanisms
- Clear error feedback
- Performance under stress

**Example Test Case:**
```typescript
it('should handle low confidence speech and provide feedback', async () => {
  // Simulates noisy kitchen environment with 45% confidence
  // Verifies fallback behavior and user feedback
})
```

#### 3. Server Workflow
**Context:** Servers taking customer orders quickly
**Test Focus:**
- Fast order processing
- Multiple item orders
- Order modifications
- Real-time feedback

**Example Test Case:**
```typescript
it('should handle quick order dictation with multiple items', async () => {
  // Simulates: "Two eggs benedict, one avocado toast, three coffees"
  // Verifies accurate parsing and processing
})
```

### Error Handling Scenarios

#### Network Issues
- DeepSeek API failures
- Fallback to raw transcript
- Graceful degradation

#### Permission Issues
- Microphone access denial
- Clear error messages
- Recovery instructions

#### Environmental Issues
- Noisy environments
- Low confidence speech
- Automatic retry logic

### Accessibility Testing

#### Keyboard Navigation
- Full keyboard accessibility
- Focus management
- Enter key support

#### Screen Reader Support
- ARIA attributes
- Status announcements
- Error announcements

#### Visual Feedback
- Clear state indicators
- Progress feedback
- Error visualization

## Test Data and Mocking

### Speech Recognition Mocking
The tests use comprehensive mocking of the Web Speech API:

```typescript
const mockSpeechRecognition = {
  lang: '',
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
  onstart: vi.fn(),
  onresult: vi.fn(),
  onerror: vi.fn(),
  onend: vi.fn(),
  start: vi.fn(),
  abort: vi.fn(),
}
```

### DeepSeek API Mocking
Tests mock the DeepSeek API for text processing:

```typescript
global.fetch = vi.fn()
```

### Realistic Test Data
Tests use realistic restaurant scenarios:

- **Menu Items:** "Grilled salmon with roasted vegetables and lemon butter sauce"
- **Orders:** "Two eggs benedict, one avocado toast, three coffees"
- **Ingredients:** "Organic free-range eggs, artisanal sourdough bread, locally sourced avocado"
- **Dietary Info:** "Gluten-free, dairy-free, contains nuts, suitable for vegetarians"

## Performance Benchmarks

### Expected Performance Targets
- **Response Time:** < 2 seconds for speech recognition
- **Processing Time:** < 1 second for text processing
- **Error Recovery:** < 3 seconds for automatic retry
- **Concurrent Users:** Support for 5+ simultaneous users

### Stress Testing
- Rapid start/stop cycles
- Concurrent workflow execution
- Memory usage under load
- Network failure recovery

## Continuous Integration

### GitHub Actions Integration
These tests are designed to run in CI/CD pipelines:

```yaml
- name: Run Acceptance Tests
  run: npm test -- --run src/test/acceptance/
```

### Pre-commit Hooks
Tests can be integrated into pre-commit hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test -- --run src/test/acceptance/"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Test Timeouts
If tests timeout, check:
- Mock implementations
- Async/await usage
- Network request mocking

#### Mock Failures
If mocks fail:
- Verify mock setup
- Check import order
- Ensure proper cleanup

#### Browser API Issues
If browser APIs fail:
- Verify mock implementations
- Check test environment setup
- Ensure proper polyfills

### Debug Mode
Run tests in debug mode for detailed output:

```bash
npm test -- --run --reporter=verbose src/test/acceptance/
```

## Contributing

### Adding New Scenarios
1. Identify real-world usage pattern
2. Create test scenario in appropriate file
3. Add realistic test data
4. Include error handling cases
5. Update documentation

### Test Naming Convention
- Use descriptive scenario names
- Include user role and context
- Specify expected behavior
- Use present tense

### Test Structure
```typescript
describe('Scenario: [User Role] [Context]', () => {
  it('should [expected behavior] when [condition]', async () => {
    // Arrange: Setup test data and mocks
    // Act: Perform user actions
    // Assert: Verify expected outcomes
  })
})
```

## Maintenance

### Regular Updates
- Update test data to reflect current menu items
- Adjust performance benchmarks as needed
- Review and update error scenarios
- Maintain accessibility compliance

### Test Data Management
- Keep test data realistic and current
- Update language examples regularly
- Maintain diverse test scenarios
- Document test data sources

This comprehensive acceptance test suite ensures the voice input system meets real-world restaurant requirements and provides a reliable foundation for continuous development and deployment. 