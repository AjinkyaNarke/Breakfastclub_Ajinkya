# Test Execution Guide - Berlin Fusion Breakfast Club

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Environment Setup
```bash
# Clone the repository
git clone [repository-url]
cd breakfast-club-berlin-fusion

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your test credentials

# Start development server
npm run dev
```

## Test Execution Commands

### 1. Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit -- --coverage --watchAll=false

# Run specific test file
npm run test:unit -- --testPathPattern=AdminSettings

# Run tests in watch mode
npm run test:unit -- --watch
```

### 2. Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm run test:integration -- --testPathPattern=AdminSettingsIntegration

# Run integration tests with verbose output
npm run test:integration -- --verbose
```

### 3. End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with Playwright
npx playwright test

# Run specific E2E test
npx playwright test admin-settings.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Run E2E tests in debug mode
npx playwright test --debug
```

### 4. Performance Tests
```bash
# Run performance tests
npm run test:performance

# Bundle analysis
npm run build:analyze

# Lighthouse CI
npx lhci autorun
```

### 5. All Tests
```bash
# Run complete test suite
npm run test:all

# Run tests with coverage report
npm run test:coverage
```

## Test Environment Configuration

### Environment Variables for Testing
```bash
# Required for testing
VITE_SUPABASE_URL=your_test_supabase_url
VITE_SUPABASE_ANON_KEY=your_test_supabase_key
VITE_DEEPGRAM_API_KEY=your_test_deepgram_key
VITE_RECRAFT_API_KEY=your_test_recraft_key
VITE_DEEPSEEK_API_KEY=your_test_deepseek_key
VITE_DEBUG_MODE=true

# Optional for testing
VITE_TEST_MODE=true
VITE_MOCK_API=true
```

### Test Database Setup
```sql
-- Create test database
CREATE DATABASE breakfast_club_test;

-- Run migrations
-- (Use your migration scripts)

-- Seed test data
INSERT INTO ingredients (name, name_de, category_id, unit) VALUES
('Test Tomato', 'Test Tomate', 'vegetables', 'piece'),
('Test Chicken', 'Test Hähnchen', 'meat', 'kg');

INSERT INTO menu_items (name, name_de, price, category_id) VALUES
('Test Avocado Toast', 'Test Avocado Toast', 12.50, 'breakfast');
```

## Manual Testing Checklist

### 1. Authentication Testing
- [ ] **Login Flow**
  - Navigate to `/admin/login`
  - Enter valid credentials
  - Verify redirect to dashboard
  - Verify session persistence

- [ ] **Logout Flow**
  - Click logout button
  - Verify redirect to login page
  - Verify session cleared

- [ ] **Route Protection**
  - Try accessing `/admin` without login
  - Verify redirect to login
  - Verify protected routes inaccessible

### 2. Admin Settings Testing
- [ ] **General Settings Tab**
  - Navigate to `/admin/settings`
  - Verify all form fields load
  - Test form validation
  - Test save functionality

- [ ] **Branding Tab**
  - Test logo upload
  - Test favicon upload
  - Test file validation
  - Test preview functionality

- [ ] **Usage & Credits Tab**
  - Verify usage data displays
  - Test refresh functionality
  - Verify progress bars accurate

- [ ] **AI Services Tab**
  - Verify service status displays
  - Test service information
  - Verify usage tracking

### 3. Menu Management Testing
- [ ] **Menu Items List**
  - Navigate to `/admin/menu`
  - Verify items display correctly
  - Test search functionality
  - Test category filtering

- [ ] **Add Menu Item**
  - Click "Add Menu Item"
  - Fill out form with test data
  - Test multi-language fields
  - Test image upload
  - Verify save functionality

- [ ] **Edit Menu Item**
  - Click edit on existing item
  - Modify fields
  - Test save changes
  - Verify updates display

### 4. Ingredient Management Testing
- [ ] **Ingredients List**
  - Navigate to `/admin/ingredients`
  - Verify ingredients display
  - Test search and filtering
  - Test category selection

- [ ] **Add Ingredient**
  - Click "Add Ingredient"
  - Test multi-step form
  - Test auto-translation
  - Test image generation
  - Verify save functionality

- [ ] **Bulk Voice Creation**
  - Click "Bulk Add Ingredients"
  - Test voice input
  - Test transcription accuracy
  - Test batch processing

### 5. Voice Input Testing
- [ ] **Basic Voice Input**
  - Test microphone access
  - Test recording start/stop
  - Test transcription display
  - Test error handling

- [ ] **Enhanced Voice Input**
  - Test Deepgram integration
  - Test real-time transcription
  - Test language detection
  - Test connection stability

- [ ] **Mobile Voice Input**
  - Test on mobile device
  - Test touch interactions
  - Test responsive design
  - Test mobile browser compatibility

### 6. AI Features Testing
- [ ] **Image Generation**
  - Test individual image generation
  - Test batch image generation
  - Test cost tracking
  - Test error handling

- [ ] **Translation Services**
  - Test German/English switching
  - Test auto-translation
  - Test form field translations
  - Test content persistence

### 7. Responsive Design Testing
- [ ] **Desktop Testing**
  - Test on 1920x1080 resolution
  - Test on 1366x768 resolution
  - Test sidebar collapse/expand
  - Test table responsiveness

- [ ] **Tablet Testing**
  - Test on iPad (1024x768)
  - Test on Android tablet
  - Test touch interactions
  - Test orientation changes

- [ ] **Mobile Testing**
  - Test on iPhone (375x667)
  - Test on Android phone
  - Test hamburger menu
  - Test touch gestures

### 8. Browser Compatibility Testing
- [ ] **Chrome Testing**
  - Test latest version
  - Test voice input
  - Test file uploads
  - Test all features

- [ ] **Firefox Testing**
  - Test latest version
  - Test voice input
  - Test file uploads
  - Test all features

- [ ] **Safari Testing**
  - Test latest version
  - Test voice input
  - Test file uploads
  - Test all features

- [ ] **Edge Testing**
  - Test latest version
  - Test voice input
  - Test file uploads
  - Test all features

## Performance Testing

### Frontend Performance
```bash
# Build for production
npm run build

# Analyze bundle size
npm run build:analyze

# Run Lighthouse
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

### API Performance
```bash
# Test API endpoints
curl -X GET http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/settings -H "Content-Type: application/json" -d '{"test": "data"}'
```

## Error Testing

### Network Error Simulation
```bash
# Simulate offline mode
# Disconnect network or use browser dev tools

# Test error handling
# Verify error messages display
# Verify retry mechanisms work
```

### API Error Testing
```bash
# Test with invalid API keys
# Test with expired tokens
# Test with malformed requests
# Verify error responses
```

## Accessibility Testing

### Manual Accessibility Testing
- [ ] **Keyboard Navigation**
  - Tab through all interactive elements
  - Test Enter/Space key functionality
  - Test Escape key functionality
  - Verify focus indicators visible

- [ ] **Screen Reader Testing**
  - Test with NVDA (Windows)
  - Test with VoiceOver (Mac)
  - Verify all content announced
  - Verify form labels announced

- [ ] **Color Contrast**
  - Test with color contrast analyzer
  - Verify WCAG AA compliance
  - Test with high contrast mode

## Test Reporting

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Results
```bash
# Generate test report
npm run test:report

# View test results
open test-results/index.html
```

### Performance Reports
```bash
# Generate performance report
npm run test:performance

# View Lighthouse report
open lighthouse-report.html
```

## Troubleshooting

### Common Issues

#### Tests Failing
```bash
# Clear test cache
npm run test:clear

# Reset test database
npm run test:reset

# Check environment variables
echo $VITE_SUPABASE_URL
```

#### Voice Input Not Working
```bash
# Check microphone permissions
# Verify HTTPS in production
# Check browser compatibility
# Verify Deepgram API key
```

#### File Upload Issues
```bash
# Check file size limits
# Verify file types allowed
# Check Supabase storage configuration
# Verify CORS settings
```

#### Performance Issues
```bash
# Check bundle size
npm run build:analyze

# Check API response times
# Verify database queries
# Check memory usage
```

## Continuous Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run build
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npm run install:hooks

# Run pre-commit checks
npm run pre-commit
```

---

**Last Updated:** January 2025
**Version:** 1.0
**Maintained By:** Development Team 