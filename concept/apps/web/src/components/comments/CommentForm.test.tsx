import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/test-utils';
import CommentForm from './CommentForm';

describe('CommentForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the input field with default placeholder', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('should render the input with custom placeholder', () => {
      render(<CommentForm onSubmit={mockOnSubmit} placeholder="Custom text..." />);
      expect(screen.getByPlaceholderText('Custom text...')).toBeInTheDocument();
    });

    it('should autofocus the input when autoFocus prop is true', () => {
      render(<CommentForm onSubmit={mockOnSubmit} autoFocus={true} />);
      expect(screen.getByPlaceholderText('Add a comment...')).toHaveFocus();
    });

    it('should not autofocus the input when autoFocus prop is false', () => {
      render(<CommentForm onSubmit={mockOnSubmit} autoFocus={false} />);
      expect(screen.getByPlaceholderText('Add a comment...')).not.toHaveFocus();
    });

    it('should render the Send button', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />);
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });

    it('should not render Cancel button when onCancel is not provided', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />);
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('should render Cancel button when onCancel prop is provided', () => {
      render(<CommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should disable Send button when input is empty', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const submitButton = screen.getByRole('button', { name: 'Send' });
      expect(submitButton).toBeDisabled();
    });

    it('should disable Send button when input contains only whitespace', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');

      await user.type(input, '   ');
      const submitButton = screen.getByRole('button', { name: 'Send' });
      expect(submitButton).toBeDisabled();
    });

    it('should enable Send button when input has text', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');

      await user.type(input, 'Test comment');
      const submitButton = screen.getByRole('button', { name: 'Send' });
      expect(submitButton).not.toBeDisabled();
    });

    it('should show loading state (... button text) during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmission: () => void;
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve;
      });
      mockOnSubmit.mockImplementation(() => submissionPromise);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');

      await user.type(input, 'Test comment');
      const submitButton = screen.getByRole('button', { name: 'Send' });
      await user.click(submitButton);

      // The button should show loading state
      expect(screen.getByRole('button', { name: '...' })).toBeInTheDocument();

      // Complete the submission
      resolveSubmission!();

      // Wait for button to return to normal
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
      });
    });

    it('should reset submitting state after submission completes', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, 'Test');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with trimmed content when form is submitted', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, '  Test comment  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test comment', undefined);
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('should pass parentCommentId to onSubmit when provided', async () => {
      const user = userEvent.setup();
      const parentId = 'comment-123';
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} parentCommentId={parentId} />);

      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, 'Reply text');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Reply text', parentId);
      });
    });

    it('should clear the input field after successful submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, 'Test comment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not call onSubmit if input is empty', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} />);

      // Try to click submit without typing anything
      const submitButton = screen.getByRole('button', { name: 'Send' });
      expect(submitButton).toBeDisabled();

      // Submit button is disabled, so we need to verify it won't submit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit if input is whitespace only', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');

      await user.type(input, '   ');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      // Button should be disabled, so no click needed
      expect(submitButton).toBeDisabled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle multiple submissions sequentially', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: 'Send' });

      // First submission
      await user.type(input, 'First comment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });

      expect(mockOnSubmit).toHaveBeenCalledWith('First comment', undefined);

      // Second submission
      await user.type(input, 'Second comment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(2);
      });

      expect(mockOnSubmit).toHaveBeenLastCalledWith('Second comment', undefined);
    });

    it('should trim content with leading and trailing whitespace', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, '\n  \t  Content with whitespace  \n  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          'Content with whitespace',
          undefined
        );
      });
    });

    it('should preserve internal whitespace when trimming', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, '  Hello   World  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Hello   World', undefined);
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not clear input when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;

      await user.type(input, 'Cancel test');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(input.value).toBe('Cancel test');
    });

    it('should not call onSubmit when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      const input = screen.getByPlaceholderText('Add a comment...');

      await user.type(input, 'Test content');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Interactions', () => {
    it('should update input value as user types', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;

      await user.type(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });

    it('should allow deleting text with backspace', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;

      await user.type(input, 'Hello');
      await user.type(input, '{backspace}{backspace}');

      expect(input.value).toBe('Hel');
    });

    it('should update button disabled state as user types', async () => {
      const user = userEvent.setup();
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // After typing
      await user.type(input, 'Text');
      expect(submitButton).not.toBeDisabled();

      // After clearing
      await user.clear(input);
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Threading Context', () => {
    it('should work correctly for root-level comments (no parentCommentId)', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, 'Root comment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Root comment', undefined);
      });
    });

    it('should work correctly for reply comments (with parentCommentId)', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      const parentId = 'comment-456';

      render(
        <CommentForm
          onSubmit={mockOnSubmit}
          parentCommentId={parentId}
          placeholder="Reply to comment..."
        />
      );

      const input = screen.getByPlaceholderText('Reply to comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, 'This is a reply');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('This is a reply', parentId);
      });
    });

    it('should preserve parentCommentId across multiple submissions', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      const parentId = 'comment-789';

      render(<CommentForm onSubmit={mockOnSubmit} parentCommentId={parentId} />);

      const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: 'Send' });

      // First reply
      await user.type(input, 'First reply');
      await user.click(submitButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });

      // Second reply
      await user.type(input, 'Second reply');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(2);
      });

      // Both calls should include the same parentCommentId
      expect(mockOnSubmit).toHaveBeenNthCalledWith(1, 'First reply', parentId);
      expect(mockOnSubmit).toHaveBeenNthCalledWith(2, 'Second reply', parentId);
    });
  });

  describe('Edge Cases', () => {
    it('should trim content with leading and trailing whitespace', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, '\n  \t  Content with whitespace  \n  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          'Content with whitespace',
          undefined
        );
      });
    });

    it('should preserve internal whitespace when trimming', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByRole('button', { name: 'Send' });

      await user.type(input, '  Hello   World  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Hello   World', undefined);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form structure', () => {
      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Add a comment...');
    });

    it('should have accessible buttons', () => {
      render(<CommentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      const sendButton = screen.getByRole('button', { name: 'Send' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      expect(sendButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should announce loading state via button text change', async () => {
      const user = userEvent.setup();
      let resolveSubmission: () => void;
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve;
      });
      mockOnSubmit.mockImplementation(() => submissionPromise);

      render(<CommentForm onSubmit={mockOnSubmit} />);
      const input = screen.getByPlaceholderText('Add a comment...');

      await user.type(input, 'Test');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      // Button text should change to indicate loading
      expect(screen.getByRole('button', { name: '...' })).toBeInTheDocument();

      // Complete submission
      resolveSubmission!();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
      });
    });
  });
});
