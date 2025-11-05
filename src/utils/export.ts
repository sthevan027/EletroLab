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
    margin: [8, 8, 8, 8],
    filename: `relatorio_multifase_${report.equipment?.tag || 'equipamento'}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  return await html2pdf().from(html).set(pdfOptions).outputPdf('blob');
}

/**
 * Gera HTML para relatório cupom
 */
function generateCupomHTML(report: IRReport, options: ExportOptions): string {
  const physicsMeta = (report.meta as any)?.physics;
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <p><strong>Categoria:</strong> ${report.category}</p>
      ${report.tag ? `<p><strong>Tag:</strong> ${report.tag}</p>` : ''}
      ${report.manufacturer ? `<p><strong>Fabricante:</strong> ${report.manufacturer}</p>` : ''}
      ${report.model ? `<p><strong>Modelo:</strong> ${report.model}</p>` : ''}
      ${report.client ? `<p><strong>Cliente:</strong> ${report.client}</p>` : ''}
      ${report.site ? `<p><strong>Local:</strong> ${report.site}</p>` : ''}
      ${report.operator ? `<p><strong>Operador:</strong> ${report.operator}</p>` : ''}
      ${physicsMeta ? `
      <div style="margin-top:6px; border-top:1px dashed #000; padding-top:6px;">
        <p><strong>Modo:</strong> Física</p>
        ${physicsMeta.material ? `<p><strong>Material:</strong> ${physicsMeta.material}</p>` : ''}
        ${physicsMeta.gauge ? `<p><strong>Bitola:</strong> ${physicsMeta.gauge} mm²</p>` : ''}
        ${physicsMeta.lengthMeters ? `<p><strong>Comprimento:</strong> ${physicsMeta.lengthMeters} m</p>` : ''}
        <p><strong>Ri base:</strong> ${physicsMeta.RiBaseMOhm.toFixed(2)} MΩ</p>
        <p><strong>Fator de escala:</strong> ${physicsMeta.scaleFactor.toFixed(2)}</p>
        <p><strong>Ambiente:</strong> ${physicsMeta.temperature.toFixed(1)}°C / ${physicsMeta.humidity.toFixed(0)}%</p>
      </div>
      ` : ''}
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
  const equipmentInfo = report.equipment || { tag: '', category: '' };
  const summary = report.summary || { phaseCount: 0, averageResistance: 0, status: '' };
  
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="label">Equipamento:</span>
          <span class="value">${equipmentInfo.tag || 'N/A'}</span>
        </div>
        <div class="metadata-item">
          <span class="label">Operador:</span>
          <span class="value">${report.operator || 'N/A'}</span>
        </div>
        <div class="metadata-item">
          <span class="label">Total de Fases:</span>
          <span class="value">${summary.phaseCount || 'N/A'}</span>
        </div>
        <div class="metadata-item">
          <span class="label">Status:</span>
          <span class="value status-${summary.status?.toLowerCase() || 'unknown'}">${summary.status || 'N/A'}</span>
        </div>
        ${equipmentInfo.model ? `
        <div class="metadata-item">
          <span class="label">Modelo:</span>
          <span class="value">${equipmentInfo.model}</span>
        </div>
        ` : ''}
        <div class="metadata-item">
          <span class="label">Data/Hora:</span>
          <span class="value">${report.createdAt.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  ` : '';

  const readingsHTML = report.readings?.map(reading => `
    <tr>
      <td>${reading.phase}</td>
      <td>${reading.time}</td>
      <td>${reading.resistance}</td>
      ${reading.temperature ? `<td>${reading.temperature}°C</td>` : '<td>-</td>'}
      ${reading.humidity ? `<td>${reading.humidity}%</td>` : '<td>-</td>'}
    </tr>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório Multi-Fase - ${equipmentInfo.tag || 'Equipamento'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
          background: white;
          padding: 15mm;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        .title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 12px;
          color: #6b7280;
        }
        
        .metadata {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .metadata-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
        }
        
        .metadata-item .label {
          font-weight: 600;
          color: #374151;
        }
        
        .metadata-item .value {
          font-weight: 500;
          color: #1f2937;
        }
        
        .status-ok {
          color: #059669;
          font-weight: bold;
        }
        
        .status-warning {
          color: #d97706;
          font-weight: bold;
        }
        
        .status-error {
          color: #dc2626;
          font-weight: bold;
        }
        
        .summary-section {
          background: #f1f5f9;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 0 8px 8px 0;
        }
        
        .summary-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }
        
        .summary-item {
          text-align: center;
          padding: 8px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        
        .summary-item .label {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-item .value {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
          margin-top: 2px;
        }
        
        .readings-section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .readings-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .readings-table th {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          font-weight: 600;
          text-align: center;
          padding: 10px 8px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .readings-table td {
          padding: 8px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
          font-size: 10px;
        }
        
        .readings-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .readings-table tr:hover {
          background: #e0f2fe;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 9px;
          color: #6b7280;
        }
        
        .footer .company {
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        .footer .timestamp {
          color: #9ca3af;
        }
        
        @media print {
          body {
            padding: 10mm;
          }
          
          .readings-table {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">EletriLab</div>
        <h1 class="title">RELATÓRIO MULTI-FASE</h1>
        <p class="subtitle">Análise de Resistência de Isolamento - Equipamentos Multi-Fase</p>
      </div>
      
      ${metadata}
      
      <div class="summary-section">
        <div class="summary-title">Resumo do Teste</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">Fases Testadas</div>
            <div class="value">${summary.phaseCount || 'N/A'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Resistência Média</div>
            <div class="value">${summary.averageResistance ? `${summary.averageResistance} MΩ` : 'N/A'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Status Geral</div>
            <div class="value status-${summary.status?.toLowerCase() || 'unknown'}">${summary.status || 'N/A'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Confiança IA</div>
            <div class="value">${Math.round((report as any).confidence * 100 || 85)}%</div>
          </div>
        </div>
      </div>
      
      <div class="readings-section">
        <div class="section-title">Leituras de Resistência</div>
        <table class="readings-table">
          <thead>
            <tr>
              <th>Fase</th>
              <th>Tempo</th>
              <th>Resistência</th>
              <th>Temp.</th>
              <th>Umid.</th>
            </tr>
          </thead>
          <tbody>
            ${readingsHTML}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <div class="company">EletriLab Ultra-MVP</div>
        <div class="timestamp">Gerado em ${new Date().toLocaleString('pt-BR')} | Powered by AI</div>
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
