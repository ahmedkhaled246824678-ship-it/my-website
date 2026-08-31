import React, { useState } from 'react';
import {
  X,
  Share2,
  Send,
  Copy,
  Check,
  Mail,
  Printer,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Edit3,
  FileText,
  Download,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { sendWhatsAppMessage } from '../../utils/whatsappPrinter';
import { customAlert } from '../../utils/dialog';
import { Language, t } from '../../utils/i18n';
import { WhatsAppRecipientSelector } from './WhatsAppRecipientSelector';
import { CustomerSupplier, Employee, BankAccount, CompanySettings, UserAccount } from '../../types';
import { WhatsAppContact } from '../../utils/whatsappContacts';
import { AccountPdfOptions, generateAccountPdfBlob, shareAccountPdfViaWhatsApp } from '../../utils/pdfGenerator';
import { getCompanySettings } from '../../utils/storage';

export interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  entityName?: string;
  initialReportText: string;
  defaultPhone?: string;
  pdfOptions?: AccountPdfOptions;
  onPrintPdf?: () => void;
  onExportExcel?: () => void;
  customersSuppliers?: CustomerSupplier[];
  employees?: Employee[];
  banks?: BankAccount[];
  settings?: CompanySettings;
  users?: UserAccount[];
  lang?: Language;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  entityName,
  initialReportText,
  defaultPhone = '',
  pdfOptions,
  onPrintPdf,
  onExportExcel,
  customersSuppliers,
  employees,
  banks,
  settings,
  users,
  lang = 'ar'
}) => {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [reportText, setReportText] = useState(initialReportText);
  const [copied, setCopied] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'whatsapp_pdf' | 'whatsapp' | 'email' | 'clipboard' | 'print'>('whatsapp_pdf');

  // تحديث النص عند تغير initialReportText
  React.useEffect(() => {
    setReportText(initialReportText);
  }, [initialReportText]);

  if (!isOpen) return null;

  const currentSettings = settings || getCompanySettings();

  // تحضير كائن PDF إذا لم يكن ممرراً
  const resolvePdfOptions = (): AccountPdfOptions => {
    if (pdfOptions) return pdfOptions;
    
    // بناء كائن PDF افتراضي من نص التقرير
    const lines = reportText.split('\n').filter(l => l.trim().length > 0);
    const rows = lines.map((l, i) => [`${i + 1}`, l]);

    return {
      title: title || 'تقرير محاسبي معتمد',
      subtitle: subtitle || entityName,
      accountName: entityName || title,
      date: new Date().toISOString().slice(0, 10),
      currency: currentSettings.currency || 'ر.س',
      headers: ['م', 'البيان والتفاصيل'],
      rows: rows,
      notes: 'تم استخراج هذا التقرير وتجهيزه رسمياً للطباعة والمطابقة المالية.',
      companySettings: currentSettings
    };
  };

  // إرسال بالواتساب
  const handleSendWhatsApp = (isGeneralWhatsApp: boolean = false) => {
    let fullPhone = isGeneralWhatsApp ? '' : phoneNumber.trim().replace(/[^0-9]/g, '');
    let finalMsg = reportText;

    if (!isGeneralWhatsApp && selectedContact && !finalMsg.startsWith(`عناية الأستاذ`)) {
      const greeting = `👤 *عناية الأستاذ/ة:* ${selectedContact.name} المحترم\n`;
      finalMsg = `${greeting}${finalMsg}`;
    }

    sendWhatsAppMessage(fullPhone, finalMsg);
    if (fullPhone) {
      customAlert(`تم فتح محادثة واتساب للرقم (${fullPhone}) لإرسال التقرير`, 'success');
    } else {
      customAlert('تم فتح واتساب العام بنجاح! يمكنك الآن اختيار أي جهة اتصال أو محادثة لإرسال التقرير إليها.', 'success');
    }
  };

  // إرسال كشف الحساب بصيغة PDF عبر الواتساب
  const handleSendPdfViaWhatsApp = async (isGeneralWhatsApp: boolean = false) => {
    setIsGeneratingPdf(true);
    let fullPhone = isGeneralWhatsApp ? '' : phoneNumber.trim().replace(/[^0-9]/g, '');
    let finalMsg = reportText;

    if (!isGeneralWhatsApp && selectedContact && !finalMsg.startsWith(`عناية الأستاذ`)) {
      const greeting = `👤 *عناية الأستاذ/ة:* ${selectedContact.name} المحترم\n`;
      finalMsg = `${greeting}${finalMsg}`;
    }

    try {
      const finalPdfOpts = resolvePdfOptions();
      await shareAccountPdfViaWhatsApp(fullPhone, finalMsg, finalPdfOpts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // تحميل ملف الـ PDF فقط
  const handleDownloadOnlyPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const finalPdfOpts = resolvePdfOptions();
      const { download } = await generateAccountPdfBlob(finalPdfOpts);
      download();
      customAlert('تم تنزيل ملف الـ PDF بنجاح على جهازك!', 'success');
    } catch (err) {
      customAlert('تعذر تنزيل ملف الـ PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // نسخ النص للحافظة
  const handleCopyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = reportText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      customAlert('تم نسخ نص التقرير بالكامل للحافظة بنجاح', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      customAlert('تعذر النسخ التلقائي للحافظة', 'error');
    }
  };

  // إرسال بالبريد الإلكتروني
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`${title} - ${entityName || 'نظام الرؤية المحاسبي'}`);
    const body = encodeURIComponent(reportText);
    const mailtoUrl = `mailto:${emailRecipient.trim()}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
    customAlert('تم فتح تطبيق البريد الإلكتروني لإرسال التقرير', 'success');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{title}</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  جاهز للإرسال والمطابقة PDF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {subtitle || entityName || 'مشاركة الحسابات والتقارير بصيغة PDF وعبر الواتساب والمطابقة الرسمية'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* شريط اختيار قناة المشاركة */}
        <div className="bg-slate-100 p-2 flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveChannel('whatsapp_pdf')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeChannel === 'whatsapp_pdf'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>إرسال PDF عبر الواتساب ⚡</span>
          </button>

          <button
            onClick={() => setActiveChannel('whatsapp')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeChannel === 'whatsapp'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>نص التقرير للواتساب</span>
          </button>

          <button
            onClick={() => setActiveChannel('clipboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeChannel === 'clipboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>نسخ للحافظة</span>
          </button>

          <button
            onClick={() => setActiveChannel('email')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeChannel === 'email'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>البريد الإلكتروني</span>
          </button>

          {(onPrintPdf || onExportExcel) && (
            <button
              onClick={() => setActiveChannel('print')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeChannel === 'print'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير</span>
            </button>
          )}
        </div>

        {/* محتوى القناة المختارة */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          {activeChannel === 'whatsapp_pdf' && (
            <div className="space-y-3">
              <WhatsAppRecipientSelector
                selectedPhone={phoneNumber}
                onPhoneChange={(phone, contact) => {
                  setPhoneNumber(phone);
                  if (contact) setSelectedContact(contact);
                }}
                customersSuppliers={customersSuppliers}
                employees={employees}
                banks={banks}
                settings={settings}
                users={users}
                onRecipientSelect={(contact) => {
                  setSelectedContact(contact);
                  setPhoneNumber(contact.phone);
                }}
              />

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      توليد كشف الحساب الرسمي بصيغة PDF وإرساله عبر الواتساب
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      يتم توليد ملف PDF عالي الجودة متضمن شعار الشركة، الترويسة الضريبية، جدول الحركات، والأختام الرسمية.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
                  <button
                    type="button"
                    onClick={handleDownloadOnlyPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل PDF فقط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendPdfViaWhatsApp(true)}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                    title="فتح تطبيق واتساب العام لتحديد أي جهة اتصال أو مجموعة من محادثاتك"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>فتح واتساب العام لاختيار المرسل إليه 🌐</span>
                  </button>

                  {phoneNumber.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSendPdfViaWhatsApp(false)}
                      disabled={isGeneratingPdf}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingPdf ? 'جاري تجهيز PDF...' : `إرسال PDF للرقم (${phoneNumber}) ⚡`}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeChannel === 'whatsapp' && (
            <div className="space-y-3">
              <WhatsAppRecipientSelector
                selectedPhone={phoneNumber}
                onPhoneChange={(phone, contact) => {
                  setPhoneNumber(phone);
                  if (contact) setSelectedContact(contact);
                }}
                customersSuppliers={customersSuppliers}
                employees={employees}
                banks={banks}
                settings={settings}
                users={users}
                onRecipientSelect={(contact) => {
                  setSelectedContact(contact);
                  setPhoneNumber(contact.phone);
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <p className="text-[11px] text-slate-500">
                  💡 سيتم إرسال التقرير كنص مهيكل ومطابق للطباعة والمراجعة السريعة.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>فتح واتساب العام واختيار المستلم 🌐</span>
                  </button>

                  {phoneNumber.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(false)}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال للرقم المحدد ({phoneNumber})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeChannel === 'clipboard' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">نسخ التقرير المحاسبي للحافظة</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يمكنك لصق النص المنسق في أي برنامج محادثة، مستند، أو بريد إلكتروني.
                </p>
              </div>
              <button
                onClick={handleCopyToClipboard}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ التقرير بالكامل'}</span>
              </button>
            </div>
          )}

          {activeChannel === 'email' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                أدخل البريد الإلكتروني للمستلم:
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="accountant@company.com"
                    className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الإيميل</span>
                </button>
              </div>
            </div>
          )}

          {activeChannel === 'print' && (
            <div className="flex flex-wrap items-center gap-3">
              {onPrintPdf && (
                <button
                  onClick={() => {
                    onPrintPdf();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة تقرير رسمي PDF</span>
                </button>
              )}
              {onExportExcel && (
                <button
                  onClick={() => {
                    onExportExcel();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير ملف إكسل CSV</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* معاينة نص التقرير المحاسبي القابل للمشاركة والتعديل */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>معاينة نص التقرير وكشف الحساب:</span>
            </span>
            <button
              onClick={() => setIsEditingText(!isEditingText)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingText ? 'إنهاء التعديل' : 'تعديل النص قبل الإرسال'}</span>
            </button>
          </div>

          {isEditingText ? (
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={11}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed text-right"
              dir="rtl"
            />
          ) : (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all max-h-[260px] overflow-y-auto">
              {reportText}
            </div>
          )}
        </div>

        {/* تذييل النافذة */}
        <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            طول النص: <span className="font-bold text-slate-800">{reportText.length}</span> حرف
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ</span>
            </button>

            <button
              onClick={handleSendPdfViaWhatsApp}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال PDF عبر الواتساب</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
