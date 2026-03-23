import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PatentDocxExportProps {
  title: string;
  crossReference: string;
  field: string;
  background: string[];
  summary: string[];
  drawingsBrief: { fig: string; desc: string }[];
  detailedDescription: Record<string, { title: string; paragraphs: string[] }>;
  claims: { number: number; type: 'independent' | 'dependent'; text: string }[];
  abstract: string;
}

export function PatentDocxExport(props: PatentDocxExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const {
        Document, Packer, Paragraph, TextRun, HeadingLevel,
        AlignmentType, Header, Footer, PageNumber, PageBreak,
      } = await import('docx');
      const { saveAs } = await import('file-saver');

      const DATE_STR = new Date().toISOString().split('T')[0];

      // Helper to create a styled paragraph
      const textPara = (text: string, opts?: { bold?: boolean; spacing?: number }) =>
        new Paragraph({
          spacing: { after: opts?.spacing ?? 200, line: 276 },
          children: [new TextRun({ text, bold: opts?.bold, font: 'Times New Roman', size: 24 })],
        });

      const sectionHeading = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel]) =>
        new Paragraph({
          heading: level,
          spacing: { before: 360, after: 200 },
          children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: level === HeadingLevel.HEADING_1 ? 28 : 24 })],
        });

      // Build document sections
      const children: any[] = [];

      // Title
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: props.title.toUpperCase(), bold: true, font: 'Times New Roman', size: 28 })],
      }));

      // Cross-Reference
      children.push(sectionHeading('CROSS-REFERENCE TO RELATED APPLICATIONS', HeadingLevel.HEADING_1));
      children.push(textPara(props.crossReference));

      // Field
      children.push(sectionHeading('FIELD OF THE INVENTION', HeadingLevel.HEADING_1));
      children.push(textPara(props.field));

      // Background
      children.push(sectionHeading('BACKGROUND OF THE INVENTION', HeadingLevel.HEADING_1));
      props.background.forEach(p => children.push(textPara(p)));

      // Summary
      children.push(sectionHeading('BRIEF SUMMARY OF THE INVENTION', HeadingLevel.HEADING_1));
      props.summary.forEach(p => children.push(textPara(p)));

      // Brief Description of Drawings
      children.push(sectionHeading('BRIEF DESCRIPTION OF THE DRAWINGS', HeadingLevel.HEADING_1));
      props.drawingsBrief.forEach(d =>
        children.push(textPara(`${d.fig} ${d.desc}`))
      );

      // Detailed Description
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(sectionHeading('DETAILED DESCRIPTION OF THE INVENTION', HeadingLevel.HEADING_1));

      Object.values(props.detailedDescription).forEach(section => {
        children.push(sectionHeading(section.title, HeadingLevel.HEADING_2));
        section.paragraphs.forEach(p => children.push(textPara(p)));
      });

      // Claims
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(sectionHeading('CLAIMS', HeadingLevel.HEADING_1));
      children.push(textPara('What is claimed is:'));

      props.claims.forEach(claim => {
        const prefix = `${claim.number}. `;
        children.push(new Paragraph({
          spacing: { after: 240, line: 276 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: prefix, bold: true, font: 'Times New Roman', size: 24 }),
            new TextRun({ text: claim.text.trim(), font: 'Times New Roman', size: 24 }),
          ],
        }));
      });

      // Abstract
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(sectionHeading('ABSTRACT OF THE DISCLOSURE', HeadingLevel.HEADING_1));
      children.push(textPara(props.abstract));

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: { font: 'Times New Roman', size: 24 },
            },
          },
          paragraphStyles: [
            {
              id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 28, bold: true, font: 'Times New Roman' },
              paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
            },
            {
              id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 24, bold: true, font: 'Times New Roman' },
              paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 1 },
            },
          ],
        },
        sections: [{
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: {
            default: new Header({
              children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Attorney Docket No. ZEN-001', font: 'Times New Roman', size: 20, italics: true })],
              })],
            }),
          },
          footers: {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', font: 'Times New Roman', size: 20 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 }),
                ],
              })],
            }),
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `ZenSolar_Utility_Patent_Application_${DATE_STR}.docx`);
      toast.success('Patent application DOCX exported successfully');
    } catch (error) {
      console.error('DOCX export error:', error);
      toast.error('Failed to export DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} className="gap-2">
      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Export USPTO DOCX
    </Button>
  );
}
