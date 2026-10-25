/**
 * Satark Safety SDK — prototype client (v0.1).
 *
 * The integration boundary a host payment app would call around a transfer:
 *   1. preTransactionCheck() before showing the PIN screen
 *   2. if decision === 'CHECKIN_REQUIRED', run the Safety Check-in (server-driven questions)
 *   3. getDecision() again; if 'GUARDIAN_APPROVAL_REQUIRED', wait for a guardian
 *   4. complete() / cancel() once the host app finishes or abandons the transfer
 *
 * In this repository the only host app is the Satark mock UPI web app. There is no
 * integration with PhonePe, Google Pay, Paytm, BHIM or any bank, and no real money moves.
 * See docs/SDK_AND_MOCK_UPI_ARCHITECTURE.md for the native Android/iOS boundary design.
 */
import { api } from '../api/endpoints';
import { CallState, SdkCompleteResponse, SdkDecision } from '../api/types';

export interface PreTransactionRequest {
  payeeVpa: string;
  payeeName?: string;
  amount: number;
  note?: string;
  /** Must come from an explicit user report or a demo simulation — never inferred silently. */
  callState?: CallState;
}

export interface SatarkSafetySdk {
  preTransactionCheck(req: PreTransactionRequest): Promise<SdkDecision>;
  getDecision(simulationId: string): Promise<SdkDecision>;
  complete(simulationId: string): Promise<SdkCompleteResponse>;
  cancel(simulationId: string): Promise<SdkCompleteResponse>;
}

export const satarkSafetySdk: SatarkSafetySdk = {
  preTransactionCheck: (req) =>
    api.sdkPreTransactionCheck({
      payee_vpa: req.payeeVpa,
      payee_name: req.payeeName,
      amount: req.amount,
      note: req.note,
      call_state: req.callState ?? 'NONE',
    }),
  getDecision: (simulationId) => api.sdkGetDecision(simulationId),
  complete: (simulationId) => api.sdkComplete(simulationId),
  cancel: (simulationId) => api.sdkCancel(simulationId),
};
