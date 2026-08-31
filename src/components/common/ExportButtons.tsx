import React from 'react';
import { Printer, FileSpreadsheet, Download } from 'lucide-react';
import { exportToExcel, printReportAsPDF } from '../../utils/export';

interface ExportButtonsProps {
  title: string;
  subtitle?: string;
  data?: Record<string, any>[];
  filename?: string;
  headersMap?: Record<string, string>;
  htmlContent?: string;
  onPrintCustom?: () => void;
  onExcelCustom?: () => void;
  className?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  title,
  subtitle,
  data,
  filename = 'report_export',
  headersMap,
  htmlContent,
  onPrintCustom,
  onExcelCustom,
  className = ''
}) => {
  const handlePrint = () => {
    if (onPrintCustom) {
      onPrintCustom();
      return;
    }
    if (htmlContent) {
      printReportAsPDF(title, htmlContent, subtitle);
    } else if (data && data.length && data[0]) {
      // بناء جدول تلقائي للطباعة من البيانات
      const keys = Object.keys(data[0]);
      const headers = headersMap ? keys.map(k => headersMap[k] || k) : keys;
      
      let tableHtml = '<table><thead><tr>';
      headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
      tableHtml += '</tr></thead><tbody>';
      
      data.forEach(row => {
        tableHtml += '<tr>';
        keys.forEach(k => {
          const val = row[k];
          tableHtml += `<td>${val !== null && val !== undefined ? val : '-'}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';
      
      printReportAsPDF(title, tableHtml, subtitle);
    } else {
      alert('لا توجد بيانات متاحة للطباعة');
    }
  };

  const handleExcel = () => {
    if (onExcelCustom) {
      onExcelCustom();
      return;
    }
    if (data && data.length) {
      exportToExcel(data, filename, headersMap);
    } else {
      alert('لا توجد بيانات متاحة للتصدير إلى إكسل');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition duration-150"
        title="طباعة التقرير أو إصداره كملف PDF"
      >
        <Printer className="w-4 h-4" />
        <span>طباعة / PDF</span>
      </button>
      
      <button
        onClick={handleExcel}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition duration-150"
        title="تصدير البيانات إلى ملف إكسل CSV مع ترميز عربي"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>تصدير إكسل</span>
      </button>
    </div>
  );
};
