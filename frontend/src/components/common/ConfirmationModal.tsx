import React from 'react';
import { Modal } from '@carbon/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={isOpen}
      modalHeading={title}
      primaryButtonText={confirmLabel}
      secondaryButtonText={cancelLabel}
      danger={isDangerous}
      onRequestSubmit={onConfirm}
      onRequestClose={onCancel}
      size="sm"
    >
      <p className="cds--modal-content-text text-sm text-[#525252] leading-relaxed pt-2">
        {message}
      </p>
    </Modal>
  );
};
