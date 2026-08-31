import { getCompanySettings } from './storage';
import { getSystemLanguage, Language } from './i18n';

/**
 * يقم بتصدير البيانات إلى ملف Excel (CSV مع دعم UTF-8 BOM للغة العربية)
 */
export function exportToExcel(data: Record<string, any>[], filename: string, headersMap?: Record<string, string>): void {
  if (!data || !data.length || !data[0]) {
    alert('لا توجد بيانات متاحة للتصدير!');
    return;
  }

  const keys = Object.keys(data[0]);
  const headers = headersMap ? keys.map(k => headersMap[k] || k) : keys;
  
  const csvRows: string[] = [];
  // إضافة صف العناوين
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  // إضافة سطور البيانات
  data.forEach(row => {
    const values = keys.map(key => {
      const val = row[key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  // استخدام BOM (\uFEFF) لضمان تعرف إكسل على الترميز العربي بشكل صحيح 100%
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  headers?: string[];
  rows?: (string | number)[][];
  totals?: { label: string; value: string | number }[];
  companyName?: string;
  taxNumber?: string;
  contentHtml?: string;
  lang?: Language;
}

/**
 * نافذة الطباعة واصدار ملفات PDF بتنسيق رسمي وممتاز متوافق مع كافة اللغات المحاسبية
 */
export function printReportAsPDF(
  titleOrOptions: string | PrintReportOptions,
  contentHtmlArg?: string,
  subtitleArg?: string,
  langArg?: Language
): void {
  const settings = getCompanySettings();
  const currentLang = (typeof titleOrOptions === 'object' && titleOrOptions.lang) 
    ? titleOrOptions.lang 
    : (langArg || getSystemLanguage());

  const isRtl = currentLang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  let title = '';
  let subtitle: string | undefined = '';
  let contentHtml = '';

  if (typeof titleOrOptions === 'object') {
    title = titleOrOptions.title;
    subtitle = titleOrOptions.subtitle;

    if (titleOrOptions.contentHtml) {
      contentHtml = titleOrOptions.contentHtml;
    } else if (titleOrOptions.headers && titleOrOptions.rows) {
      const thead = `<thead><tr>${titleOrOptions.headers.map(h => `<th class="${isRtl ? 'text-right' : 'text-left'}">${h}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${titleOrOptions.rows.map(row => `<tr>${row.map(cell => {
        const isNum = typeof cell === 'number' || (!isNaN(Number(cell)) && cell !== '' && typeof cell === 'string' && /^[0-9,.-]+$/.test(String(cell).trim()));
        const cellClass = isNum ? 'font-mono text-num' : '';
        return `<td class="${cellClass}">${cell !== undefined && cell !== null ? cell : ''}</td>`;
      }).join('')}</tr>`).join('')}</tbody>`;
      
      let tfoot = '';
      if (titleOrOptions.totals && titleOrOptions.totals.length > 0) {
        tfoot = `<tfoot>${titleOrOptions.totals.map(tot => `<tr class="total-row"><td colspan="${Math.max(1, (titleOrOptions.headers?.length || 2) - 1)}" class="${isRtl ? 'text-right' : 'text-left'} font-bold">${tot.label}</td><td class="text-blue font-bold font-mono text-num">${tot.value}</td></tr>`).join('')}</tfoot>`;
      }

      contentHtml = `<table>${thead}${tbody}${tfoot}</table>`;
    }
  } else {
    title = titleOrOptions;
    contentHtml = contentHtmlArg || '';
    subtitle = subtitleArg;
  }

  const printWindow = window.open('', '_blank', 'width=1050,height=850');
  
  if (!printWindow) {
    alert(isRtl ? 'يرجى السماح بالنافذة المنبثقة (Pop-ups) لإتمام عملية الطباعة وتصدير PDF.' : 'Please allow pop-ups to print or export PDF.');
    return;
  }

  const locale = currentLang === 'ar' ? 'ar-EG' : currentLang === 'de' ? 'de-DE' : 'en-US';
  const currentDate = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  // Labels based on language
  const labels = {
    cr: currentLang === 'de' ? 'Handelsregister' : currentLang === 'en' ? 'Commercial Reg.' : 'سجل تجاري',
    vat: currentLang === 'de' ? 'Steuernummer' : currentLang === 'en' ? 'Tax / VAT ID' : 'الرقم الضريبي',
    phone: currentLang === 'de' ? 'Tel' : currentLang === 'en' ? 'Phone' : 'هاتف',
    issueDate: currentLang === 'de' ? 'Ausstellungsdatum' : currentLang === 'en' ? 'Issue Date' : 'تاريخ الإصدار',
    printTime: currentLang === 'de' ? 'Druckzeit' : currentLang === 'en' ? 'Print Time' : 'وقت الطباعة',
    fiscalYear: currentLang === 'de' ? 'Geschäftsjahr' : currentLang === 'en' ? 'Fiscal Year' : 'السنة المالية',
    currency: currentLang === 'de' ? 'Währung' : currentLang === 'en' ? 'Currency' : 'العملة',
    accountant: currentLang === 'de' ? 'Verantwortlicher Buchhalter' : currentLang === 'en' ? 'Responsible Accountant' : 'المحاسب المسؤول',
    cfo: currentLang === 'de' ? 'Finanzleiter (CFO)' : currentLang === 'en' ? 'Financial Director (CFO)' : 'المدير المالي',
    gm: currentLang === 'de' ? 'Genehmigung Geschäftsleitung' : currentLang === 'en' ? 'Managing Director Approval' : 'اعتماد الإدارة والختم الرسمي',
    printBtn: currentLang === 'de' ? '🖨️ Drucken / Als PDF speichern' : currentLang === 'en' ? '🖨️ Print / Save as PDF' : '🖨️ طباعة أو حفظ كملف PDF',
    closeBtn: currentLang === 'de' ? '✖ Schließen' : currentLang === 'en' ? '✖ Close' : '✖ إغلاق',
    footerRights: currentLang === 'de' 
      ? `Automatisch generiert vom integrierten ERP-System © ${new Date().getFullYear()} ${settings.companyName}`
      : currentLang === 'en'
      ? `System-generated official report by Al-Roeya ERP © ${new Date().getFullYear()} ${settings.companyName}`
      : `تم استخراج هذا التقرير آلياً من النظام المحاسبي الشامل - ${settings.companyName} © ${new Date().getFullYear()}`
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${currentLang}" dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${settings.companyName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Amiri:wght@700&family=Inter:wght@400;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: ${isRtl ? "'Tajawal', sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
          color: #0f172a;
          background: #ffffff;
          padding: 30px;
          line-height: 1.5;
          direction: ${dir};
          -webkit-font-smoothing: antialiased;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2.5px solid #1e3a8a;
          padding-bottom: 18px;
          margin-bottom: 22px;
        }

        .company-info {
          text-align: ${isRtl ? 'right' : 'left'};
        }

        .company-name {
          font-family: ${isRtl ? "'Amiri', serif" : "'Inter', sans-serif"};
          font-size: 24px;
          font-weight: 800;
          color: #1e3a8a;
          margin-bottom: 3px;
        }

        .company-sub {
          font-size: 12px;
          color: #475569;
          line-height: 1.4;
        }

        .report-meta {
          text-align: ${isRtl ? 'left' : 'right'};
          font-size: 11.5px;
          color: #334155;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 14px;
          line-height: 1.6;
        }

        .report-title-box {
          text-align: center;
          margin: 18px 0 24px 0;
          background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%);
          color: #ffffff;
          padding: 14px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }

        .report-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .report-subtitle {
          font-size: 13px;
          color: #cbd5e1;
          margin-top: 4px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 25px;
          font-size: 12px;
        }

        th {
          background-color: #1e3a8a !important;
          color: #ffffff !important;
          font-weight: 700;
          text-align: ${isRtl ? 'right' : 'left'};
          padding: 10px 8px;
          border: 1px solid #1e3a8a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        td {
          padding: 8px;
          border: 1px solid #cbd5e1;
          color: #1e293b;
        }

        tr:nth-child(even) td {
          background-color: #f8fafc !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .total-row td {
          background-color: #e2e8f0 !important;
          font-weight: 800;
          color: #0f172a;
          border-top: 2px solid #334155;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-feature-settings: "tnum";
          font-variant-numeric: tabular-nums;
        }

        .text-num {
          font-weight: 600;
          color: #0f172a;
          direction: ltr !important;
          display: inline-block;
        }

        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-green { color: #047857; font-weight: bold; }
        .text-red { color: #b91c1c; font-weight: bold; }
        .text-blue { color: #1e3a8a; font-weight: bold; }

        .footer-signatures {
          display: flex;
          justify-content: space-around;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          page-break-inside: avoid;
        }

        .sig-box {
          text-align: center;
          width: 200px;
        }

        .sig-title {
          font-weight: 700;
          font-size: 13px;
          color: #334155;
          margin-bottom: 45px;
        }

        .sig-line {
          border-bottom: 1px solid #94a3b8;
          width: 100%;
        }

        .print-footer {
          margin-top: 35px;
          font-size: 10.5px;
          color: #64748b;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }

        @media print {
          body { padding: 10px; }
          .no-print { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }

        .print-btn-bar {
          background: #1e3a8a;
          color: white;
          padding: 12px 18px;
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .print-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 9px 22px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .print-btn:hover { background: #059669; }

        .close-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 9px 18px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
        }
        .close-btn:hover { background: #dc2626; }
      </style>
    </head>
    <body>
      <div class="print-btn-bar no-print">
        <button class="print-btn" onclick="window.print()">${labels.printBtn}</button>
        <button class="close-btn" onclick="window.close()">${labels.closeBtn}</button>
      </div>

      <div class="header">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${settings.logoUrl ? `
            <div style="width: 65px; height: 65px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 3px;">
              <img src="${settings.logoUrl}" alt="${settings.companyName}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            </div>
          ` : ''}
          <div class="company-info">
            <div class="company-name">${settings.companyName}</div>
            <div class="company-sub">${labels.cr}: ${settings.commercialRegister || '1010543210'} | ${labels.vat}: ${settings.taxNumber || '300458921000003'}</div>
            <div class="company-sub">${settings.address || 'المقر الرئيسي'} - ${labels.phone}: ${settings.phone || '011-4567890'}</div>
          </div>
        </div>
        <div class="report-meta">
          <div><strong>${labels.issueDate}:</strong> ${currentDate}</div>
          <div><strong>${labels.printTime}:</strong> ${currentTime}</div>
          <div><strong>${labels.fiscalYear}:</strong> ${settings.fiscalYearStart?.slice(0, 4) || '2026'}</div>
          <div><strong>${labels.currency}:</strong> ${settings.currency || 'ج.م'}</div>
        </div>
      </div>

      <div class="report-title-box">
        <div class="report-title">${title}</div>
        ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
      </div>

      <div class="content-container">
        ${contentHtml}
      </div>

      <div class="footer-signatures">
        <div class="sig-box">
          <div class="sig-title">${labels.accountant}</div>
          <div class="sig-line"></div>
        </div>
        <div class="sig-box">
          <div class="sig-title">${labels.cfo}</div>
          <div class="sig-line"></div>
        </div>
        <div class="sig-box">
          <div class="sig-title">${labels.gm}</div>
          <div class="sig-line"></div>
        </div>
      </div>

      <div class="print-footer">
        ${labels.footerRights}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
}
