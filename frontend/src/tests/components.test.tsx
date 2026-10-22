import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskSeverityBadge } from '../components/common/RiskSeverityBadge';
import { CopyButton } from '../components/common/CopyButton';

describe('Reusable UI Components', () => {
  it('renders RiskSeverityBadge with proper semantic coloring and labels', () => {
    const { rerender } = render(<RiskSeverityBadge severity="HIGH_RISK" score={92} />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('(92/100)')).toBeInTheDocument();

    rerender(<RiskSeverityBadge severity="CAUTION" score={50} />);
    expect(screen.getByText('Caution')).toBeInTheDocument();

    rerender(<RiskSeverityBadge severity="SAFE" score={10} />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('renders CopyButton with default label', () => {
    render(<CopyButton textToCopy="Sample text to copy" label="Copy Text" />);
    expect(screen.getByText('Copy Text')).toBeInTheDocument();
  });
});
