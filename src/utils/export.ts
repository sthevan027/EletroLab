/**
 * Funções de exportação para relatórios IR
 */

import html2pdf from 'html2pdf.js';
import { IRReport, MultiPhaseReport, ExportOptions } from '../types';

/**
 * Exporta relatório IR para PDF no formato cupom
 */
export async function exportCupomPDF(
  report: IRReport, 
  options: ExportOptions = { format: 'pdf', includeTests: true, includeCharts: false, includeMetadata: true, includeComments: false }
): Promise<Blob> {
  const html = generateCupomHTML(report, options);
  
  const pdfOptions = {
    margin: [5, 5, 5, 5],
    filename: `relatorio_ir_${report.category}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { 
      unit: 'mm', 
      format: 'a7', 
      orientation: 'portrait' 
    }
  };
  
  return await html2pdf().from(html).set(pdfOptions).outputPdf('blob');
}

/**
 * Exporta relatório multi-fase para PDF
 */
export async function exportMultiPhasePDF(
  report: MultiPhaseReport,
  options: ExportOptions = { format: 'pdf', includeTests: true, includeCharts: true, includeMetadata: true, includeComments: true }
): Promise<Blob> {
  const html = generateMultiPhaseHTML(report, options);
  
  const pdfOptions = {
    margin: [10, 10, 10, 10],
    filename: `relatorio_multifase_${report.reports?.length || 0}_fases_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };
  
  return await html2pdf().from(html).set(pdfOptions).outputPdf('blob');
}

/**
 * Gera HTML para relatório cupom
 */
function generateCupomHTML(report: IRReport, options: ExportOptions): string {
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <p><strong>Categoria:</strong> ${report.category}</p>
      ${report.tag ? `<p><strong>Tag:</strong> ${report.tag}</p>` : ''}
      ${report.manufacturer ? `<p><strong>Fabricante:</strong> ${report.manufacturer}</p>` : ''}
      ${report.model ? `<p><strong>Modelo:</strong> ${report.model}</p>` : ''}
      ${report.client ? `<p><strong>Cliente:</strong> ${report.client}</p>` : ''}
      ${report.site ? `<p><strong>Local:</strong> ${report.site}</p>` : ''}
      ${report.operator ? `<p><strong>Operador:</strong> ${report.operator}</p>` : ''}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório IR - ${report.category}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          margin: 0;
          padding: 10px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .title {
          font-size: 14px;
          font-weight: bold;
          margin: 0;
        }
        .metadata {
          font-size: 8px;
          margin-bottom: 10px;
        }
        .metadata p {
          margin: 2px 0;
        }
        .readings-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        .readings-table th,
        .readings-table td {
          border: 1px solid #000;
          padding: 3px;
          text-align: center;
          font-size: 9px;
        }
        .readings-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        .dai {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          margin-top: 10px;
          padding: 5px;
          border: 2px solid #000;
        }
        .footer {
          font-size: 8px;
          text-align: center;
          margin-top: 10px;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">RELATÓRIO IR - ${report.category.toUpperCase()}</h1>
        <p>Data: ${report.createdAt.toLocaleDateString('pt-BR')}</p>
      </div>
      
      ${metadata}
      
      <table class="readings-table">
        <thead>
          <tr>
            <th>Tempo</th>
            <th>kV</th>
            <th>Resistência</th>
          </tr>
        </thead>
        <tbody>
          ${report.readings.map(reading => `
            <tr>
              <td>${reading.time}</td>
              <td>${reading.kv}</td>
              <td>${reading.resistance}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="dai">
        DAI: ${report.dai}
      </div>
      
      <div class="footer">
        <p>Gerado por EletriLab Ultra-MVP</p>
        <p>${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera HTML para relatório multi-fase
 */
function generateMultiPhaseHTML(report: MultiPhaseReport, options: ExportOptions): string {
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <p><strong>Total de Relatórios:</strong> ${report.reports?.length || 0}</p>
      <p><strong>Fases/Fases:</strong> ${(report.summary as any)?.phaseToPhase || 'N/A'}</p>
      <p><strong>Fases/Massa:</strong> ${(report.summary as any)?.phaseToGround || 'N/A'}</p>
      ${(report.equipment as any)?.model ? `<p><strong>Modelo:</strong> ${(report.equipment as any).model}</p>` : ''}
      ${report.equipment?.tag ? `<p><strong>Tag:</strong> ${report.equipment.tag}</p>` : ''}
    </div>
  ` : '';

  const reportsHTML = (report.reports || []).map(subReport => `
    <div class="sub-report">
      <h3>${subReport.id} - Test No: ${subReport.testNo}</h3>
      <p><strong>Tipo:</strong> ${subReport.type === 'phase-phase' ? 'Fase/Fase' : 'Fase/Massa'}</p>
      <p><strong>Descrição:</strong> ${subReport.description}</p>
      
      <table class="readings-table">
        <thead>
          <tr>
            <th>Tempo</th>
            <th>kV</th>
            <th>Resistência</th>
          </tr>
        </thead>
        <tbody>
          ${subReport.readings.map(reading => `
            <tr>
              <td>${reading.time}</td>
              <td>${reading.kv}</td>
              <td>${reading.resistance}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p><strong>DAI:</strong> ${subReport.dai}</p>
      ${options.includeComments ? `<p><strong>Comentários:</strong> ${subReport.comments}</p>` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório Multi-Fase</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }
        .metadata {
          margin-bottom: 20px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 5px;
        }
        .metadata p {
          margin: 5px 0;
        }
        .sub-report {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .sub-report h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        .readings-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        .readings-table th,
        .readings-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        .readings-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">RELATÓRIO MULTI-FASE</h1>
        <p>Data: ${report.createdAt.toLocaleDateString('pt-BR')}</p>
      </div>
      
      ${metadata}
      
      ${reportsHTML}
      
      <div class="footer">
        <p>Gerado por EletriLab Ultra-MVP com IA</p>
        <p>${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Exporta relatório IR para CSV
 */
export function exportCupomCSV(report: IRReport): string {
  const headers = ['Tempo', 'kV', 'Resistência'];
  const rows = report.readings.map(reading => [
    reading.time,
    reading.kv,
    reading.resistance
  ]);
  
  // Adicionar linha do DAI
  rows.push(['DAI', '', report.dai]);
  
  // Adicionar metadados se disponíveis
  if (report.tag) rows.push(['Tag', '', report.tag]);
  if (report.manufacturer) rows.push(['Fabricante', '', report.manufacturer]);
  if (report.model) rows.push(['Modelo', '', report.model]);
  if (report.client) rows.push(['Cliente', '', report.client]);
  if (report.site) rows.push(['Local', '', report.site]);
  if (report.operator) rows.push(['Operador', '', report.operator]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Exporta relatório multi-fase para CSV
 */
export function exportMultiPhaseCSV(report: MultiPhaseReport): string {
  const headers = ['Report ID', 'Test No', 'Type', 'Description', 'Phases', 'Time', 'kV', 'Resistance', 'DAI', 'Comments'];
  const rows: string[][] = [];
  
  (report.reports || []).forEach(subReport => {
    subReport.readings.forEach((reading, index) => {
      rows.push([
        subReport.id,
        subReport.testNo.toString(),
        subReport.type,
        subReport.description,
        subReport.phases.join('/'),
        reading.time,
        reading.kv,
        reading.resistance,
        index === 3 ? subReport.dai : '', // DAI apenas na última linha
        index === 3 ? subReport.comments : '' // Comentários apenas na última linha
      ]);
    });
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Download de arquivo
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Exporta relatório IR
 */
export async function exportIRReport(
  report: IRReport, 
  format: 'pdf' | 'csv' = 'pdf',
  options: ExportOptions = { format, includeTests: true, includeCharts: false, includeMetadata: true, includeComments: false }
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `relatorio_ir_${report.category}_${timestamp}`;
  
  if (format === 'pdf') {
    const blob = await exportCupomPDF(report, options);
    downloadFile(blob, `${baseFilename}.pdf`, 'application/pdf');
  } else {
    const csv = exportCupomCSV(report);
    downloadFile(csv, `${baseFilename}.csv`, 'text/csv');
  }
}

/**
 * Exporta relatório multi-fase
 */
export async function exportMultiPhaseReport(
  report: MultiPhaseReport,
  format: 'pdf' | 'csv' = 'pdf',
  options: ExportOptions = { format, includeTests: true, includeCharts: true, includeMetadata: true, includeComments: true }
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `relatorio_multifase_${report.reports?.length || 0}_fases_${timestamp}`;
  
  if (format === 'pdf') {
    const blob = await exportMultiPhasePDF(report, options);
    downloadFile(blob, `${baseFilename}.pdf`, 'application/pdf');
  } else {
    const csv = exportMultiPhaseCSV(report);
    downloadFile(csv, `${baseFilename}.csv`, 'text/csv');
  }
}

/**
 * Exporta múltiplos relatórios em lote
 */
export async function exportBatchReports(
  reports: (IRReport | MultiPhaseReport)[],
  format: 'pdf' | 'csv' = 'pdf',
  options: ExportOptions = { format, includeTests: true, includeCharts: true, includeMetadata: true, includeComments: true }
): Promise<void> {
  if (reports.length === 0) return;
  
  // Se apenas um relatório, exportar normalmente
  if (reports.length === 1) {
    const report = reports[0];
    if ('reports' in report) {
      await exportMultiPhaseReport(report, format, options);
    } else {
      await exportIRReport(report as IRReport, format, options);
    }
    return;
  }
  
  // Para múltiplos relatórios, criar um arquivo ZIP seria ideal
  // Por simplicidade, vamos exportar um por vez
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    const timestamp = new Date().toISOString().split('T')[0];
    
    if ('reports' in report) {
      const filename = `relatorio_multifase_${i + 1}_${timestamp}`;
      if (format === 'pdf') {
        const blob = await exportMultiPhasePDF(report, options);
        downloadFile(blob, `${filename}.pdf`, 'application/pdf');
      } else {
        const csv = exportMultiPhaseCSV(report);
        downloadFile(csv, `${filename}.csv`, 'text/csv');
      }
    } else {
      const filename = `relatorio_ir_${i + 1}_${timestamp}`;
      if (format === 'pdf') {
        const blob = await exportCupomPDF(report as IRReport, options);
        downloadFile(blob, `${filename}.pdf`, 'application/pdf');
      } else {
        const csv = exportCupomCSV(report as IRReport);
        downloadFile(csv, `${filename}.csv`, 'text/csv');
      }
    }
    
    // Pequeno delay para evitar sobrecarga do navegador
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
