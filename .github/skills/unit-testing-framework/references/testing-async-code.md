---
description: "Vitest async testing and coverage guidance for this repository"
---

# Testing Async Code

## Async and Promise Patterns

```typescript
import { describe, it, expect } from 'vitest';

describe('fetchUser', () => {
  it('returns user data for valid id', async () => {
    const user = await fetchUser('123');
    expect(user.id).toBe('123');
  });

  it('rejects for invalid id', async () => {
    await expect(fetchUser('invalid')).rejects.toThrow('User not found');
  });

  it('supports promise chaining style', () => {
    return fetchUser('123').then((user) => {
      expect(user.id).toBe('123');
    });
  });
});
```

## Local Commands

Run from `concept/tests/unit`:

```bash
npm test
```

Optional coverage run:

```bash
npx vitest run --coverage
```

## Coverage Targets

Use these as defaults unless a feature requires stricter thresholds:

- Statements: 80 percent or higher.
- Branches: 75 percent or higher.
- Functions: 85 percent or higher.
- Lines: 80 percent or higher.
