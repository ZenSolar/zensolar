import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportButtonsProps {
  pageTitle: string;
  getData: () => Record<string, unknown>[];
  getFileName?: () => string;
  className?: string;
}

export function ExportButtons({ pageTitle, getData, getFileName, className = "" }: ExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const fileName = getFileName?.() || `${pageTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Get the main content area
      const element = document.querySelector('.container') as HTMLElement | null;
      if (!element) {
        toast.error("Could not find content to export");
        return;
      }

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Check if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile: generate blob and open in new tab for download
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${fileName}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Try click first, fallback to opening in new tab
        try {
          link.click();
        } catch {
          window.open(blobUrl, '_blank');
        }
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
        
        toast.success(`${pageTitle} PDF ready - check your downloads or new tab`);
      } else {
        // Desktop: use standard save method
        await html2pdf().set(opt).from(element).save();
        toast.success(`${pageTitle} exported as PDF`);
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Try using your browser's Share or Print feature.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const XLSX = await import('xlsx');
      const data = getData();
      
      if (!data || data.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(data[0] || {}).map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, pageTitle.slice(0, 31));
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      toast.success(`${pageTitle} exported as Excel`);
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isExportingPDF}
        className="gap-2"
      >
        {isExportingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="gap-2"
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </Button>
    </div>
  );
}
