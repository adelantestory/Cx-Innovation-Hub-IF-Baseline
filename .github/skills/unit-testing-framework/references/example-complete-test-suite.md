---
description: "Complete Vitest unit test example aligned with repository conventions"
---

# Example: Complete Test Suite

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type UserInput = {
  email: string;
  firstName: string;
  lastName: string;
};

type UserRecord = UserInput & { id: string };

class UserService {
  constructor(
    private readonly repository: { save: (user: UserInput) => Promise<UserRecord> },
    private readonly emailService: { sendWelcomeEmail: (email: string) => Promise<void> }
  ) {}

  async createUser(input: UserInput): Promise<UserRecord> {
    if (!input.email.includes('@')) {
      throw new Error('Invalid email');
    }

    const saved = await this.repository.save(input);
    await this.emailService.sendWelcomeEmail(saved.email);
    return saved;
  }
}

describe('UserService', () => {
  const mockRepository = {
    save: vi.fn<({ email: string; firstName: string; lastName: string }) => Promise<UserRecord>>(),
  };

  const mockEmailService = {
    sendWelcomeEmail: vi.fn<(email: string) => Promise<void>>(),
  };

  let service: UserService;

  beforeEach(() => {
    service = new UserService(mockRepository, mockEmailService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user successfully', async () => {
    // Arrange
    const validUser: UserInput = {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockRepository.save.mockResolvedValue({ id: '123', ...validUser });
    mockEmailService.sendWelcomeEmail.mockResolvedValue();

    // Act
    const result = await service.createUser(validUser);

    // Assert
    expect(result.id).toBe('123');
    expect(mockRepository.save).toHaveBeenCalledWith(validUser);
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('john@example.com');
  });

  it('rejects invalid email input', async () => {
    // Arrange
    const invalidUser: UserInput = {
      email: 'invalid-email',
      firstName: 'John',
      lastName: 'Doe',
    };

    // Act + Assert
    await expect(service.createUser(invalidUser)).rejects.toThrow('Invalid email');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
```

## File Placement

Store files like this under `concept/tests/unit` using the `*.spec.ts` suffix.
