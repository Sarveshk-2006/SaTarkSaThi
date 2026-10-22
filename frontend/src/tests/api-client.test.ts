import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../api/client';

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes HTTP error responses into ApiError instances', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid scan input' }),
    } as any);

    await expect(apiClient.get('/scanner/unknown')).rejects.toThrow('Invalid scan input');
  });

  it('handles network timeouts cleanly with informative messaging', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const error: any = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(apiClient.get('/health')).rejects.toThrow(
      'Request timed out. Please check your backend connection.'
    );
  });
});
