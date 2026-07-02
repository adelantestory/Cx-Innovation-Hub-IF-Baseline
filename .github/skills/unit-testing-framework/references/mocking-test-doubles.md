---
description: "Vitest mock, spy, and stub patterns for isolated unit tests"
---

# Mocking & Test Doubles

## Mock External Dependencies with Vitest

```typescript
import { describe, it, expect, vi } from 'vitest';

const mockRepository = {
  save: vi.fn(),
  findById: vi.fn(),
};

describe('UserService', () => {
  it('saves a user through repository', async () => {
    // Arrange
    mockRepository.save.mockResolvedValue({ id: '123', email: 'john@example.com' });
    const service = new UserService(mockRepository);

    // Act
    const result = await service.createUser({ email: 'john@example.com' });

    // Assert
    expect(result.id).toBe('123');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
```

## Spy on Existing Methods

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('notification behavior', () => {
  it('sends a welcome email after user creation', async () => {
    const service = new UserService(createInMemoryRepository());
    const spy = vi.spyOn(service, 'sendWelcomeEmail').mockResolvedValue();

    await service.createUser({ email: 'john@example.com' });

    expect(spy).toHaveBeenCalledWith('john@example.com');
  });
});
```

## Mocking Rules

- Mock only external boundaries like network, database, and filesystem.
- Reset or recreate mocks per test.
- Prefer dependency injection where possible.
