import React, { useState } from 'react';
import { Button } from '@carbon/react';
import { Copy, Checkmark } from '@carbon/icons-react';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'Copy',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      kind={copied ? 'secondary' : 'ghost'}
      size="sm"
      renderIcon={copied ? Checkmark : Copy}
      onClick={handleCopy}
      className={`cds--copy-btn ${className}`}
      aria-label={copied ? 'Copied to clipboard' : `Copy ${label}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      <span>{copied ? 'Copied!' : label}</span>
    </Button>
  );
};
