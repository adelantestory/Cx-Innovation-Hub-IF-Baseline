---
description: "Edge case test patterns for Vitest unit tests"
---

# Testing Edge Cases

## Typical Edge Cases

```typescript
import { describe, it, expect } from 'vitest';

describe('processData edge cases', () => {
  it('handles null input', () => {
    expect(processData(null)).toBeNull();
  });

  it('handles undefined input', () => {
    expect(processData(undefined)).toBeUndefined();
  });

  it('handles empty string', () => {
    expect(processData('')).toBe('');
  });

  it('handles empty arrays', () => {
    expect(processData([])).toEqual([]);
  });

  it('handles max safe integer values', () => {
    expect(calculate(Number.MAX_SAFE_INTEGER)).toBeDefined();
  });

  it('sanitizes script tags', () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });
});
```

## Edge Case Checklist

- Empty values
- Null and undefined values
- Invalid format values
- Boundary numbers
- Security-sensitive strings
