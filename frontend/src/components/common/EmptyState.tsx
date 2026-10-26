import React, { ReactNode } from 'react';
import { Tile, Button } from '@carbon/react';
import { Security } from '@carbon/icons-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <Tile className="cds--empty-state flex flex-col items-center justify-center p-8 text-center bg-white border border-[#e0e0e0]">
      <div className="w-12 h-12 rounded-full bg-[#f4f4f4] text-[#0f62fe] flex items-center justify-center mb-4">
        {icon || <Security size={28} />}
      </div>
      <h3 className="text-base font-semibold text-[#161616] tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-[#525252] max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button
          onClick={onAction}
          size="md"
          kind="primary"
          className="mt-5"
        >
          {actionText}
        </Button>
      )}
    </Tile>
  );
};
