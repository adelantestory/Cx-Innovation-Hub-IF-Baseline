import fs from "fs";
import path from "path";

export interface DiscoveredTest {
  name: string;
  index: number;
}

export interface DiscoveredSuite {
  name: string;
  specFile: string;
  tests: DiscoveredTest[];
}

export function discoverTests(testsDir: string): DiscoveredSuite[] {
  const resolvedDir = path.resolve(testsDir);

  if (!fs.existsSync(resolvedDir)) {
    console.error(`Tests directory not found: ${resolvedDir}`);
    return [];
  }

  const specFiles = fs
    .readdirSync(resolvedDir)
    .filter((f) => f.endsWith(".spec.ts"));

  const suites: DiscoveredSuite[] = [];

  for (const file of specFiles) {
    const filePath = path.join(resolvedDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Extract suite name from test.describe('Name', ...)
    const describeMatch = content.match(
      /test\.describe\(\s*['"`]([^'"`]+)['"`]/
    );
    const suiteName = describeMatch ? describeMatch[1] : path.basename(file, ".spec.ts");

    // Extract individual test names: test('Name', ...)
    // Match test( but not test.describe( or test.beforeEach( etc.
    // Use backreference so inner quotes of a different type don't break the match
    const testPattern = /(?<!\.)test\(\s*(['"`])(.*?)\1/g;
    const tests: DiscoveredTest[] = [];
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = testPattern.exec(content)) !== null) {
      tests.push({ name: match[2], index: index++ });
    }

    suites.push({
      name: suiteName,
      specFile: file,
      tests,
    });
  }

  return suites;
}
