export type ToastKind = 'success' | 'info' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

export const TOAST_EVENT = 'nexusroute:toast';

export function showToast(message: string, kind: ToastKind = 'success') {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, kind } }));
}
