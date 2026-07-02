---
description: "Apply Arrange-Act-Assert structure for Vitest unit tests in this repository"
---

# Test Structure (AAA Pattern)

## Vitest AAA Pattern

Use this structure for each unit test under `concept/tests/unit`:

1. Arrange test input and dependencies.
2. Act by calling the function under test.
3. Assert expected output and behavior.

```typescript
import { describe, it, expect } from 'vitest';

describe('formatProjectName', () => {
  it('returns trimmed project name in title case', () => {
    // Arrange
    const rawName = '  taskify sprint board  ';

    // Act
    const result = formatProjectName(rawName);

    // Assert
    expect(result).toBe('Taskify Sprint Board');
  });
});
```

## Naming Guidance

- Keep file names as `*.spec.ts`.
- Keep test descriptions behavior-focused.
- One main assertion goal per `it` block.
