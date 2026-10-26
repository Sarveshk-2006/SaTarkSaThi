import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScannerPage } from '../pages/ScannerPage';
import { ToastProvider } from '../context/ToastContext';

import { api } from '../api/endpoints';

// Mock API
vi.mock('../api/endpoints', () => ({
  api: {
    getPresets: vi.fn().mockResolvedValue([
      { id: '1', title: 'Digital Arrest Threat', text: 'URGENT: CBI officer calling. Warrant issued.', channel: 'WHATSAPP' }
    ]),
    getContacts: vi.fn().mockResolvedValue([
      { id: 1, name: 'Sunita Sharma', relationship: 'Mother', phone_number: '+91 98765 43210', alert_level: 'ALL', is_active: true, is_primary: true }
    ]),
    analyzeText: vi.fn().mockResolvedValue({
      incident_id: 'SA-A1B2C3D4E5F6',
      input_type: 'text',
      risk_level: 'CRITICAL',
      risk_score: 85,
      confidence_label: 'HIGH',
      verdict: 'Digital Arrest / Law Enforcement Impersonation',
      plain_language_summary: 'High-risk indicators detected. Law enforcement never conducts arrests over video calls.',
      detected_signals: [
        { signal_type: 'AUTHORITY_IMPERSONATION', severity: 'HIGH', reason: 'Impersonation of CBI', excerpt: 'CBI officer', weight: 35 }
      ],
      supporting_evidence: ['AUTHORITY_IMPERSONATION: Impersonation of CBI'],
      recommended_actions: ['Do NOT reply to or call back this sender', 'Block the sender immediately'],
      verification_steps: ['Call 100 or 112 to verify any claimed warrant', 'Visit nearest police station'],
      should_alert_family: true,
      ai_provider: 'none',
      analysis_mode: 'rule_based',
      limitations: ['Deterministic rule-based analysis only.'],
      classification: 'Digital Arrest / Law Enforcement Impersonation',
      severity: 'HIGH_RISK',
      summary: 'High-risk indicators detected.',
      advice: 'Do not pay any money.',
      is_flagged_for_family: true,
      evidence_items: []
    }),
    analyzeUrl: vi.fn().mockResolvedValue({
      incident_id: 'SA-URL12345678',
      input_type: 'url',
      risk_level: 'HIGH',
      risk_score: 65,
      confidence_label: 'MEDIUM',
      verdict: 'Suspicious Phishing URL',
      plain_language_summary: 'Domain contains bank brand but is hosted on suspicious TLD.',
      detected_signals: [
        { signal_type: 'SUSPICIOUS_TLD', severity: 'HIGH', reason: 'Uncommon TLD', excerpt: '.xyz', weight: 25 }
      ],
      supporting_evidence: ['SUSPICIOUS_TLD: Uncommon TLD'],
      recommended_actions: ['Do not click link'],
      verification_steps: ['Verify on official bank website'],
      should_alert_family: false,
      ai_provider: 'none',
      analysis_mode: 'rule_based',
      limitations: ['Static URL structure analysis only.'],
      classification: 'Suspicious Phishing URL',
      severity: 'HIGH_RISK',
      summary: 'Suspicious URL.',
      advice: 'Do not visit.',
      is_flagged_for_family: false,
      evidence_items: []
    })
  }
}));

describe('Scanner Workspace (V1)', () => {
  it('renders all four input tabs: Text, URL, Screenshot, Voice Evidence', async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <MemoryRouter>
            <ScannerPage />
          </MemoryRouter>
        </ToastProvider>
      );
    });

    expect(screen.getByText('Text / SMS')).toBeInTheDocument();
    expect(screen.getByText('URL / Domain')).toBeInTheDocument();
    expect(screen.getByText('Screenshot (OCR)')).toBeInTheDocument();
    expect(screen.getByText('Voice Evidence')).toBeInTheDocument();
  });

  it('switches tabs and displays tab-specific controls and notices', async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <MemoryRouter>
            <ScannerPage />
          </MemoryRouter>
        </ToastProvider>
      );
    });

    // Switch to URL tab
    fireEvent.click(screen.getByText('URL / Domain'));
    expect(screen.getByPlaceholderText(/sbi-kyc-update\.xyz/)).toBeInTheDocument();
    expect(screen.getByText(/Safe Static Inspection Guarantee/i)).toBeInTheDocument();

    // Switch to Voice tab
    fireEvent.click(screen.getByText('Voice Evidence'));
    expect(screen.getByText(/Speech Recognition Capability Notice/i)).toBeInTheDocument();
  });

  it('runs analysis on text and displays structured investigation output', async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <MemoryRouter>
            <ScannerPage />
          </MemoryRouter>
        </ToastProvider>
      );
    });

    const textarea = screen.getByPlaceholderText(/Paste suspicious SMS/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'URGENT: CBI officer calling. Warrant issued.' } });
    });

    const analyzeBtn = screen.getByRole('button', { name: /Analyze Threat/i });
    await act(async () => {
      fireEvent.click(analyzeBtn);
    });

    expect(api.analyzeText).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/CRITICAL RISK/i)).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getAllByText(/Digital Arrest \/ Law Enforcement Impersonation/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Alert Family Shield Guardians/i)).toBeInTheDocument();
      expect(screen.getByText(/File Golden Hour Incident Report/i)).toBeInTheDocument();
    });
  });
});
