import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, Trash2 } from 'lucide-react';
import { subscribeDialogs } from '../../utils/dialog';

export const CustomDialogs: React.FC = () => {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    message: '',
    title: 'تأكيد الإجراء',
    onConfirm: null
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    message: '',
    title: 'إشعار النظام',
    type: 'success'
  });

  useEffect(() => {
    const unsubscribe = subscribeDialogs((type, payload) => {
      if (type === 'confirm') {
        setConfirmModal({
          isOpen: true,
          message: payload.message,
          title: payload.title || 'تأكيد الحذف والإجراء',
          onConfirm: payload.onConfirm
        });
      } else if (type === 'alert') {
        let defaultTitle = 'إشعار من النظام';
        if (payload.type === 'success') defaultTitle = 'تمت العملية بنجاح';
        if (payload.type === 'error') defaultTitle = 'تنبيه أو خطأ';
        if (payload.type === 'info') defaultTitle = 'معلومة إرشادية';

        setAlertModal({
          isOpen: true,
          message: payload.message,
          title: payload.title || defaultTitle,
          type: payload.type || 'success'
        });

        // إغلاق تلقائي للنجاح بعد 3.5 ثوانٍ
        if (payload.type === 'success') {
          setTimeout(() => {
            setAlertModal(prev => prev.message === payload.message ? { ...prev, isOpen: false } : prev);
          }, 3500);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConfirmAction = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }
    setConfirmModal({ isOpen: false, message: '', title: '', onConfirm: null });
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ isOpen: false, message: '', title: '', onConfirm: null });
  };

  const handleCloseAlert = () => {
    setAlertModal({ isOpen: false, message: '', title: '', type: 'success' });
  };

  return (
    <>
      {/* نافذة التأكيد (Confirm Modal) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-right transform transition-all animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400">يرجى مراجعة وتأكيد هذا الإجراء</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 mb-6">
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{confirmModal.message}</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancelConfirm}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition duration-150"
              >
                إلغاء والتراجع
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/30 transition duration-150"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد وتنفيذ الإجراء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة التنبيه والإشعارات (Alert Modal) */}
      {alertModal.isOpen && (
        <div className="fixed bottom-6 left-6 z-[100] max-w-sm w-full animate-slideUp">
          <div className={`rounded-2xl shadow-2xl border p-4 flex items-start gap-3.5 text-right ${
            alertModal.type === 'success' ? 'bg-emerald-900 border-emerald-700 text-white shadow-emerald-900/40' :
            alertModal.type === 'error' ? 'bg-red-900 border-red-700 text-white shadow-red-900/40' :
            alertModal.type === 'warning' ? 'bg-amber-900 border-amber-700 text-white shadow-amber-900/40' :
            'bg-slate-900 border-slate-700 text-white shadow-slate-900/40'
          }`}>
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              alertModal.type === 'success' ? 'bg-emerald-800/80 text-emerald-300' :
              alertModal.type === 'error' ? 'bg-red-800/80 text-red-300' :
              alertModal.type === 'warning' ? 'bg-amber-800/80 text-amber-300' :
              'bg-slate-800/80 text-blue-300'
            }`}>
              {alertModal.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {alertModal.type === 'error' && <XCircle className="w-6 h-6" />}
              {alertModal.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
              {alertModal.type === 'info' && <Info className="w-6 h-6" />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-sm">{alertModal.title}</h4>
                <button onClick={handleCloseAlert} className="text-white/60 hover:text-white font-bold text-sm leading-none">×</button>
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-medium">{alertModal.message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
