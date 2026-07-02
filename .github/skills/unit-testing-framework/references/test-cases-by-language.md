---
description: "Vitest-first test case patterns for TypeScript projects using Vite"
---

# Test Cases by Language

## JavaScript and TypeScript (Vitest)

This repository uses Vitest for unit tests.

```typescript
import { describe, it, expect } from 'vitest';
import { Calculator } from './calculator';

describe('Calculator', () => {
  it('adds positive numbers', () => {
    // Arrange
    const calculator = new Calculator();

    // Act
    const result = calculator.add(2, 3);

    // Assert
    expect(result).toBe(5);
  });

  it('throws on divide by zero', () => {
    // Arrange
    const calculator = new Calculator();

    // Act + Assert
    expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
  });

  it('supports decimal comparison', () => {
    // Arrange
    const calculator = new Calculator();

    // Act
    const result = calculator.divide(10, 3);

    // Assert
    expect(result).toBeCloseTo(3.333, 2);
  });
});
```

## Repo Placement Rule

Place all unit tests in `concept/tests/unit/`, including tests for code located under `apps/api` and `apps/web`.
