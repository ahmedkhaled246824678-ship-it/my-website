type ConfirmCallback = () => void;

type DialogEventType = 'confirm' | 'alert';

interface ConfirmPayload {
  message: string;
  onConfirm: ConfirmCallback;
  title?: string;
}

interface AlertPayload {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
}

type DialogListener = (type: DialogEventType, payload: any) => void;

let listeners: DialogListener[] = [];

export function subscribeDialogs(listener: DialogListener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function customConfirm(message: string, onConfirm: ConfirmCallback, title = 'تأكيد الإجراء والحذف') {
  listeners.forEach(l => l('confirm', { message, onConfirm, title }));
}

export function customAlert(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) {
  listeners.forEach(l => l('alert', { message, type, title }));
}
