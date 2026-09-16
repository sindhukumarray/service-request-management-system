import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestDetail } from '../pages/RequestDetail';
import api from '../api/api';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'req-123' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('RequestDetail XSS safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).__xssAttempt;
  });

  it.each([
    '<script>window.__xssAttempt = true;</script>',
    '<img src=x onerror="window.__xssAttempt = true" />',
    '<button onclick="window.__xssAttempt = true">Click me</button>',
  ])('renders %s as escaped text without executing script code', async (payload) => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        requestNumber: 'SR-240101-1001',
        title: payload,
        description: payload,
        category: 'OTHER',
        priority: 'MEDIUM',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        createdBy: { name: 'Alice', email: 'alice@example.com' },
        assignedTo: null,
        statusHistory: [],
      },
    } as any);

    render(<RequestDetail />);

    const matches = await screen.findAllByText(payload);
    expect(matches.length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(payload);
    expect(document.querySelector('script')).not.toBeInTheDocument();
    expect(document.querySelector('img[onerror]')).not.toBeInTheDocument();
    expect(document.querySelector('[onclick]')).not.toBeInTheDocument();
    expect((window as any).__xssAttempt).toBeUndefined();
  });
});
