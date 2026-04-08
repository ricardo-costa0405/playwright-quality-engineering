# Playwright Framework - Architecture Documentation

## System Overview

This framework implements a multi-layered architecture for enterprise-grade test automation with agent orchestration and intelligent test healing.

```
┌─────────────────────────────────────────────┐
│     Test Specifications (AAA Pattern)       │
├─────────────────────────────────────────────┤
│     Page Object Model (Clean Architecture)  │
├─────────────────────────────────────────────┤
│  Pattern Enforcement (AAA, Anti-Timeout)    │
├─────────────────────────────────────────────┤
│   Playwright Configuration & Browser Layer  │
├─────────────────────────────────────────────┤
│    Agent Orchestration (Generator, Executor)│
├─────────────────────────────────────────────┤
│   Healing & Analysis (Healer, Analyzer)     │
├─────────────────────────────────────────────┤
│   Reporting (JUnit, HTML, Allure, Screencast)│
├─────────────────────────────────────────────┤
│    CI/CD Pipeline (GitHub Actions)          │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. Pattern Enforcement Layer

#### AAA Validator
- Validates test structure before execution
- Enforces 3-phase separation (Arrange, Act, Assert)
- Ensures single action in Act phase
- Requires explicit assertions
- Prevents hardcoded timeouts via ESLint

#### Anti-Timeout Guard
- Provides approved waiting strategies
- Replaces waitForTimeout with state-based waits
- Offers 8+ waiting patterns for different scenarios
- Ensures tests are deterministic

#### Assertion Builder
- Creates deterministic state-based assertions
- Validates element state comprehensively
- API response validation
- Schema validation

### 2. Page Object Model Layer

#### BasePage Class
- Single responsibility per page
- All state-based waits (no timeouts)
- Helper methods for common actions
- Locator management and abstraction
- Proper async/await patterns

#### Page Subclasses
- LoginPage, Dashboard, etc.
- Inherit wait strategies from BasePage
- Domain-specific methods
- Clear accessibility patterns

### 3. Test Execution Layer

#### Custom Fixtures
- Authenticated page contexts
- Test data providers
- Screencast integration
- Resource cleanup

#### Test Specifications
- Pure AAA structure
- Clear test names
- Isolated test cases
- Proper setup/teardown

### 4. Configuration Layer

#### Playwright Configs
Three separate configurations:
- **web.config.ts** - Desktop browsers (Chromium, Firefox, WebKit)
- **web-mobile.config.ts** - Mobile device emulation (Pixel 5, iPhone 13, Galaxy S21)
- **screencast.config.ts** - Video recording settings

All enforce:
- No hardcoded timeouts
- Screencast recording
- JUnit reporting
- Artifact collection

#### Screencast Config
- Enables video recording for debugging
- Configures frame rate and quality
- Handles cleanup policies
- Integrates with agents

### 5. Agent Orchestration Layer

#### MessageBus
- Pub/sub communication
- Agent-to-agent messaging
- Correlation ID tracking
- Timeout handling
- Event emission

#### AgentBase
- Abstract base for all agents
- State management
- Taskexecution with error handling
- Message sending/receiving
- Logging integration

#### AgentRegistry
- Agent lifecycle management
- Health checks
- Agent discovery
- Batch operations

#### Agent Types

**TestGeneratorAgent**
- Input: User stories, recordings, MCP data
- Output: AAA-structured test specs
- Validates pattern compliance
- Generates assertions

**ExecutionAgent**
- Input: Test specifications
- Output: Test results, screencast
- Parallel execution
- Auto-retry logic
- Failure capture

**HealingAgent**
- Input: Failed tests, screencast
- Output: Updated selectors
- DOM analysis
- Selector repair suggestions
- Validation of fixes

**AnalysisAgent**
- Input: Test results, metrics
- Output: Flakiness reports
- Root cause analysis
- Optimization suggestions
- Pattern recognition

**OrchestratorAgent**
- Coordinates all agents
- Task scheduling
- Decision making
- Workflow orchestration

### 6. Utility Layer

#### Environment Manager
- Configuration centralization
- CI/CD detection
- Safe credential handling
- Base URL resolution

#### Test Data Generator
- User credentials
- Product data
- Address information
- Payment data
- Job information

#### Screencast Manager
- Session lifecycle
- Video file handling
- Analysis preparation
- Cleanup policies

### 7. Reporting Layer

#### JUnit Reporter
- Standard XML format
- CI/CD integration-ready
- Per-browser/device reports
- Merging capability
- Timestamp inclusion

#### HTML Reporter
- Visual test results
- Screenshots on failure
- Video links
- Timeline visualization
- Artifact access

#### Allure Reporter
- Advanced analytics
- Trend analysis
- Environment info
- Attachment support
- Epic/Feature hierarchy

### 8. CI/CD Layer

#### GitHub Actions Workflows

**web-tests.yml**
- Matrix: [chromium, firefox, webkit]
- Parallel browser testing
- Automatic retry (2x)
- Artifact upload
- PR commenting

**web-mobile-tests.yml**
- Matrix: [Mobile Chrome, Safari, Galaxy]
- Device emulation
- Touch simulation
- Geolocation handling
- Same artifact strategy

**smoke-tests.yml**
- Always-green guarantee
- Fast execution (<15 min)
- Critical path validation
- Fail-fast on issues
- Manual trigger support

## Data Flow

### Test Execution Flow
```
Test Start
    ↓
Load Config (Playwright)
    ↓
Setup Fixtures (CustomFixtures)
    ↓
Create Page Object (LoginPage)
    ↓
ARRANGE Phase
    ├─ Setup test data
    ├─ Navigate to page
    └─ Verify page loaded
    ↓
ACT Phase
    ├─ Execute single action
    └─ Wait for result state
    ↓
ASSERT Phase
    ├─ Verify multiple expectations
    └─ Check actual state
    ↓
Record Screencast
    ├─ Save video
    └─ Extract frames on failure
    ↓
Report Results
    ├─ JUnit XML
    ├─ HTML report
    ├─ Allure metrics
    └─ Artifacts
    ↓
Cleanup
    ├─ Close browser
    ├─ Clear cookies
    └─ Manage videos
```

### Agent Workflow Flow
```
Orchestrator Agent
    ├─ Receives test request
    ├─ Plans execution
    └─ Schedules tasks
    ↓
Test Generator Agent
    ├─ Analyzes input
    ├─ Generates specs
    └─ Validates AAA
    ↓
Execution Agent
    ├─ Runs tests
    ├─ Records screencast
    └─ Captures results
    ↓
On Failure:
    ├─ Healing Agent
    │   ├─ Analyzes screencast
    │   ├─ Suggests fixes
    │   └─ Dry-run validation
    │
    └─ Analysis Agent
        ├─ Pattern detection
        ├─ Flakiness scoring
        └─ Recommendations
    ↓
Report & Notify
    ├─ Update results
    ├─ Send notifications
    └─ Archive artifacts
```

## Wait Strategy Hierarchy

1. **Auto-wait** (Implicit) - Playwright waits for actions
2. **Expect** (Assertion) - Wait for state with timeout
3. **Load State** - Wait for DOM/network readiness
4. **Response** - Wait for specific API calls
5. **Custom Condition** - Wait for function result

❌ **Never use:**
- `page.waitForTimeout()`
- `setTimeout()`
- `sleep()`

## Timeout Configuration

### Playwright-level
```typescript
timeout: 30000,           // Test timeout
expect: {
  timeout: 10000        // Assertion timeout
}
```

### Action-level
- Implicit through auto-waiting
- No explicit action timeouts
- Built into assertion helpers

## Flakiness Prevention

### Prevention Strategies
1. **State-based waits** - Never timing-based
2. **Network idle** - Wait for all requests
3. **DOM stability** - Wait for mutations to settle
4. **Element visibility** - Verify before interaction
5. **API validation** - Wait for response
6. **Isolation** - Fresh context per test
7. **Cleanup** - Clear state between tests

### Detection & Healing
1. **Monitor** - Track retry rates
2. **Analyze** - Identify patterns
3. **Suggest** - Fix recommendations
4. **Auto-heal** - Apply best fixes
5. **Validate** - Verify improvements

## Security Considerations

### Secrets Management
- `.env` files in `.gitignore`
- No credentials in code
- Environment variables only
- CI/CD secret masking
- No API keys in logs

### Test Data Privacy
- Fake data via Faker.js
- No production data in tests
- Sanitized error messages
- Secure session handling

## Performance Optimization

### Parallelization
- Browser-level (3 parallel browsers)
- Device-level (3 mobile devices)
- Worker-level (4 workers per project)
- Dynamic based on CI env

### Record/Playback
- Screencast on-demand
- Cleanup successful tests
- Preserve failures
- Archive old videos

## Scalability Considerations

### Single Machine
- 4 workers parallel
- Multiple browsers sequential
- Fast feedback

### CI Environment
- Increased workers (4 min)
- Browser matrix (parallel)
- Artifact management
- Report aggregation

### Enterprise Scale
- Distributed agents
- Shared report infrastructure
- Scheduled test runs
- Historical trend analysis

## Maintenance

### Regular Tasks
- Review flaky tests weekly
- Analyze execution metrics
- Update selectors as UI changes
- Refresh test data
- Archive old reports

### Upgrade Path
- TypeScript updates (major annually)
- Playwright updates (quarterly)
- Node.js LTS (annually)
- Dependencies (monthly)

## Monitoring & Alerts

### Health Checks
- CI pipeline success rate
- Test execution time trends
- Flakiness detection
- Infrastructure status

### Notifications
- Failed builds
- Flakiness alerts
- Performance regression
- Agent errors

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Maintained By:** QA Team
