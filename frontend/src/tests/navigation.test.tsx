import React, { act } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { DemoModeProvider } from '../context/DemoModeContext';
import { LanguageProvider } from '../context/LanguageContext';

// Mock the API client
vi.mock('../api/endpoints', () => ({
  api: {
    checkHealth: vi.fn().mockResolvedValue({ status: 'online' }),
    getSettings: vi.fn().mockResolvedValue({
      app_name: 'Satark Saathi',
      enable_demo_seed: true,
      analysis_provider: 'rule_based',
    }),
  },
}));

describe('Navigation and Layout', () => {
  it('renders all required navigation sections in the sidebar', async () => {
    await act(async () => {
      render(
        <LanguageProvider>
          <DemoModeProvider>
            <MemoryRouter>
              <Sidebar />
            </MemoryRouter>
          </DemoModeProvider>
        </LanguageProvider>
      );
    });

    // Verify brand title
    expect(screen.getByText('Satark Saathi')).toBeInTheDocument();

    // Verify required navigation items
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Scam Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Family Shield')).toBeInTheDocument();
    expect(screen.getByText('Payment Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Golden Hour Recovery')).toBeInTheDocument();
    expect(screen.getByText('Incident History')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Verify 1930 Cyber helpline reference
    expect(screen.getByText('Cyber Crime: 1930')).toBeInTheDocument();
  });
});
