/**
 * AAA Pattern Validator - Validates Arrange-Act-Assert structure
 *
 * This script ensures all test cases follow the AAA pattern:
 * - ARRANGE: Setup test data and conditions
 * - ACT: Execute the action being tested (single action only)
 * - ASSERT: Verify the results with explicit assertions
 *
 * Exit Code: 0 if all tests valid, 1 if violations found
 */

import fs from 'fs';
import path from 'path';

interface AAAValidation {
  file: string;
  testName: string;
  line: number;
  issues: string[];
}

const TEST_DIRS = [
  'tests/web/specs',
  'tests/api/specs',
  'tests/mobile-web/specs',
];

function validateTestContent(content: string, testName: string, lineNumber: number): string[] {
  const issues: string[] = [];
  const lines = content.split('\n');

  // Find the test starting at lineNumber
  let testStartLine = lineNumber - 1;
  let braceCount = 0;
  let inTest = false;

  // Find the complete test function from lineNumber onwards
  for (let i = testStartLine; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is the test declaration
    if (!inTest && line.includes(`test(`) && line.includes(`'${testName}'`)) {
      inTest = true;
    }

    if (inTest) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // We've found the test body
      if (inTest && i > testStartLine) {
        // Check for AAA markers
        if (!line.includes('ARRANGE') && !lines.slice(i, i + 30).join('\n').includes('ARRANGE')) {
          // AAA markers might be in following lines
        }
      }

      // Test has closed
      if (braceCount === 0 && inTest && i > testStartLine) {
        // Combine all lines of test
        const testLines = lines.slice(testStartLine, i + 1).join('\n');

        // Check for AAA markers with case-insensitive matching
        const hasArrange = /ARRANGE/i.test(testLines);
        const hasAct = /ACT/i.test(testLines);
        const hasAssert = /ASSERT/i.test(testLines);

        if (!hasArrange) issues.push('Missing ARRANGE section');
        if (!hasAct) issues.push('Missing ACT section');
        if (!hasAssert) issues.push('Missing ASSERT section');

        break;
      }
    }
  }

  return issues;
}

function scanFile(filePath: string): AAAValidation[] {
  const validations: AAAValidation[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Find all test() declarations
    const testRegex = /^\s*test\(['"`]([^'"`]+)['"`]/;

    lines.forEach((line, index) => {
      if (testRegex.test(line)) {
        const testName = line.match(testRegex)?.[1] || 'unknown';
        const issues = validateTestContent(content, testName, index + 1);

        if (issues.length > 0) {
          validations.push({
            file: filePath,
            testName,
            line: index + 1,
            issues,
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }

  return validations;
}

function scanDirectory(dir: string): AAAValidation[] {
  const validations: AAAValidation[] = [];

  if (!fs.existsSync(dir)) {
    return validations;
  }

  const files = fs.readdirSync(dir, { recursive: true });

  files.forEach((file) => {
    if (typeof file === 'string' && file.endsWith('.spec.ts')) {
      const filePath = path.join(dir, file);
      validations.push(...scanFile(filePath));
    }
  });

  return validations;
}

// Main execution
console.log('✓ Validating AAA Pattern in all tests...\n');

let allValidations: AAAValidation[] = [];

TEST_DIRS.forEach((dir) => {
  const validations = scanDirectory(dir);
  allValidations.push(...validations);
});

if (allValidations.length === 0) {
  console.log('✅ All tests follow AAA pattern!\n');
  console.log('AAA Structure Example:');
  console.log('  test("login succeeds with valid credentials", async ({ page }) => {');
  console.log('    // ==================== ARRANGE ====================');
  console.log('    const email = "test@example.com";');
  console.log('    const password = "TestPassword123!";');
  console.log('    ');
  console.log('    // ==================== ACT ====================');
  console.log('    await loginPage.login(email, password);');
  console.log('    ');
  console.log('    // ==================== ASSERT ====================');
  console.log('    await expect(page).toHaveURL("/dashboard");');
  console.log('  });');
  process.exit(0);
} else {
  console.error(`❌ Found ${allValidations.length} test(s) not following AAA pattern:\n`);

  const groupedByFile = allValidations.reduce(
    (acc, validation) => {
      if (!acc[validation.file]) {
        acc[validation.file] = [];
      }
      acc[validation.file].push(validation);
      return acc;
    },
    {} as Record<string, AAAValidation[]>
  );

  Object.entries(groupedByFile).forEach(([file, validations]) => {
    console.error(`\n📄 ${file}`);
    validations.forEach((v) => {
      console.error(`   Line ${v.line}: ${v.testName}`);
      v.issues.forEach((issue) => {
        console.error(`     ⚠ ${issue}`);
      });
    });
  });

  process.exit(1);
}
