import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { VazirRegularBase64, VazirBoldBase64 } from './fonts/vazirFontBase64';

// تبدیل داده به فرمت مناسب برای جدول
const prepareTableData = (data, columns) => {
  return data.map(row => {
    return columns.map(col => {
      if (typeof col.accessor === 'function') {
        return col.accessor(row);
      }
      if (col.key) {
        return row[col.key] || '';
      }
      return '';
    });
  });
};

// ثبت فونت وزیر (هر دو وزن) روی نمونهٔ jsPDF
const registerPersianFont = (doc) => {
  doc.addFileToVFS('Vazirmatn-Regular.ttf', VazirRegularBase64);
  doc.addFont('Vazirmatn-Regular.ttf', 'Vazir', 'normal');

  doc.addFileToVFS('Vazirmatn-Bold.ttf', VazirBoldBase64);
  doc.addFont('Vazirmatn-Bold.ttf', 'Vazir', 'bold');

  doc.setFont('Vazir');
};

// خروجی PDF
export const exportToPDF = (data, columns, title, filename = 'report') => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    registerPersianFont(doc);

    doc.setFont('Vazir', 'bold');
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    doc.setFont('Vazir', 'normal');
    doc.setFontSize(10);
    doc.text(`تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, pageWidth / 2, 22, { align: 'center' });

    const headers = columns.map(col => col.label);
    const rows = prepareTableData(data, columns);

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: {
        font: 'Vazir',
        fontSize: 8,
        cellPadding: 2,
        halign: 'right',
      },
      headStyles: {
        font: 'Vazir',
        fontStyle: 'bold',
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 9,
        halign: 'right',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { left: 10, right: 10 },
    });

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  }
};

// خروجی Excel
export const exportToExcel = (data, columns, filename = 'report') => {
  try {
    const excelData = data.map(row => {
      const newRow = {};
      columns.forEach(col => {
        if (typeof col.accessor === 'function') {
          newRow[col.label] = col.accessor(row);
        } else if (col.key) {
          newRow[col.label] = row[col.key] || '';
        }
      });
      return newRow;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = columns.map(col => ({
      wch: Math.max(col.label.length * 2, 12),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw error;
  }
};

// خروجی CSV
export const exportToCSV = (data, columns, filename = 'report') => {
  try {
    const excelData = data.map(row => {
      const newRow = {};
      columns.forEach(col => {
        if (typeof col.accessor === 'function') {
          newRow[col.label] = col.accessor(row);
        } else if (col.key) {
          newRow[col.label] = row[col.key] || '';
        }
      });
      return newRow;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('CSV Export Error:', error);
    throw error;
  }
};

export const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};