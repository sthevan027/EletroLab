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

// ==========================================
// EXPORTAÇÃO PDF - MICROHMÍMETRO
// ==========================================

export async function exportMicrohmPDF(data: {
  voltage_V: number;
  current_A: number;
  reference_Ohm: number;
  R_Ohm: number;
  percentDelta: number;
  status: string;
  possibleBadContact: boolean;
  tag?: string;
  client?: string;
  operator?: string;
  date?: string;
}): Promise<Blob> {
  const statusLabel = data.status === 'ok' ? 'OK' : data.status === 'alerta' ? 'ALERTA' : 'MAU CONTATO';
  const statusColor = data.status === 'ok' ? '#22c55e' : data.status === 'alerta' ? '#f59e0b' : '#ef4444';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
      <div style="text-align:center;border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:20px;">
        <h1 style="font-size:22px;color:#7c3aed;margin:0;">RELATÓRIO DE MICROHMÍMETRO</h1>
        <p style="color:#6b7280;font-size:12px;margin-top:4px;">EletriLab - Relatório de Qualidade</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">TAG</strong><br/>${data.tag || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">CLIENTE</strong><br/>${data.client || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">OPERADOR</strong><br/>${data.operator || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">DATA</strong><br/>${data.date || new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="text-align:left;padding:10px;border:1px solid #d1d5db;font-size:13px;">Parâmetro</th>
            <th style="text-align:right;padding:10px;border:1px solid #d1d5db;font-size:13px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Tensão Aplicada</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.voltage_V} V</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Corrente Medida</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.current_A} A</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Referência</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.reference_Ohm} Ω</td></tr>
          <tr style="background:#f9fafb;font-weight:bold;"><td style="padding:8px 10px;border:1px solid #e5e7eb;">R Medida</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.R_Ohm} Ω</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Desvio</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.percentDelta.toFixed(2)}%</td></tr>
        </tbody>
      </table>
      <div style="text-align:center;padding:16px;border-radius:12px;background:${statusColor}15;border:2px solid ${statusColor};">
        <span style="font-size:18px;font-weight:bold;color:${statusColor};">${statusLabel}</span>
        ${data.possibleBadContact ? '<p style="color:#ef4444;font-size:12px;margin-top:4px;">Possível mau contato detectado</p>' : ''}
      </div>
      <p style="text-align:center;font-size:10px;color:#9ca3af;margin-top:24px;">Gerado por EletriLab</p>
    </div>`;

  return await html2pdf().from(html).set({
    margin: [10, 10, 10, 10],
    filename: `relatorio_microhm_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).outputPdf('blob');
}

// ==========================================
// EXPORTAÇÃO PDF - HI-POT
// ==========================================

export async function exportHipotPDF(data: {
  nominalVoltage_V: number;
  Vteste_V: number;
  formulaUsed: string;
  tag?: string;
  client?: string;
  operator?: string;
  date?: string;
}): Promise<Blob> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
      <div style="text-align:center;border-bottom:3px solid #ea580c;padding-bottom:16px;margin-bottom:20px;">
        <h1 style="font-size:22px;color:#ea580c;margin:0;">RELATÓRIO DE HI-POT</h1>
        <p style="color:#6b7280;font-size:12px;margin-top:4px;">EletriLab - Relatório de Qualidade</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">TAG</strong><br/>${data.tag || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">CLIENTE</strong><br/>${data.client || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">OPERADOR</strong><br/>${data.operator || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">DATA</strong><br/>${data.date || new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="text-align:left;padding:10px;border:1px solid #d1d5db;font-size:13px;">Parâmetro</th>
            <th style="text-align:right;padding:10px;border:1px solid #d1d5db;font-size:13px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Tensão Nominal</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.nominalVoltage_V} V</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Fórmula Utilizada</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.formulaUsed === '2V+1000' ? '2·V + 1000' : '1.5 × V'}</td></tr>
          <tr style="background:#fff7ed;font-weight:bold;font-size:16px;"><td style="padding:12px 10px;border:1px solid #e5e7eb;">Tensão de Teste</td><td style="text-align:right;padding:12px 10px;border:1px solid #e5e7eb;color:#ea580c;">${data.Vteste_V} V</td></tr>
        </tbody>
      </table>
      <p style="text-align:center;font-size:10px;color:#9ca3af;margin-top:24px;">Gerado por EletriLab</p>
    </div>`;

  return await html2pdf().from(html).set({
    margin: [10, 10, 10, 10],
    filename: `relatorio_hipot_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).outputPdf('blob');
}

// ==========================================
// EXPORTAÇÃO PDF - CABO
// ==========================================

export async function exportCablePDF(data: {
  power: number;
  voltage: number;
  powerFactor: number;
  systemType: string;
  distance: number;
  voltageDropPercent: number;
  current_A: number;
  minSection_mm2: number;
  resistance_Ohm: number;
  actualDrop: number;
  status: string;
  breakerIn?: number;
  breakerCurve?: string;
  coordinationOk?: boolean;
  tag?: string;
  client?: string;
  operator?: string;
}): Promise<Blob> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
      <div style="text-align:center;border-bottom:3px solid #3b82f6;padding-bottom:16px;margin-bottom:20px;">
        <h1 style="font-size:22px;color:#3b82f6;margin:0;">RELATÓRIO DE LANÇAMENTO DE CABO</h1>
        <p style="color:#6b7280;font-size:12px;margin-top:4px;">EletriLab - Relatório de Qualidade</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">TAG</strong><br/>${data.tag || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">CLIENTE</strong><br/>${data.client || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">OPERADOR</strong><br/>${data.operator || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">DATA</strong><br/>${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <h3 style="font-size:14px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Parâmetros de Entrada</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Potência</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;">${data.power} W</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Tensão</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;">${data.voltage} V</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">FP</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;">${data.powerFactor}</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Sistema</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;">${data.systemType}</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Distância</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;">${data.distance} m</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Queda Admitida</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;">${data.voltageDropPercent}%</td></tr>
        </tbody>
      </table>
      <h3 style="font-size:14px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Resultados</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>
          <tr style="background:#f0f9ff;font-weight:bold;"><td style="padding:8px 10px;border:1px solid #e5e7eb;">Corrente</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.current_A} A</td></tr>
          <tr style="background:#f0f9ff;font-weight:bold;"><td style="padding:8px 10px;border:1px solid #e5e7eb;">Seção Mínima</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.minSection_mm2} mm²</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Resistência</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;">${data.resistance_Ohm} Ω</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">Queda Real</td><td style="text-align:right;padding:6px 10px;border:1px solid #e5e7eb;color:${data.status === 'queda_alta' ? '#ef4444' : '#22c55e'};">${data.actualDrop}%</td></tr>
        </tbody>
      </table>
      ${data.breakerIn ? `
        <h3 style="font-size:14px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Disjuntor</h3>
        <p style="font-size:16px;font-weight:bold;">${data.breakerIn} A - Curva ${data.breakerCurve || 'C'} ${data.coordinationOk ? '✓ Coordenação OK' : '✗ Coordenação inválida'}</p>
      ` : ''}
      <p style="text-align:center;font-size:10px;color:#9ca3af;margin-top:24px;">Gerado por EletriLab</p>
    </div>`;

  return await html2pdf().from(html).set({
    margin: [10, 10, 10, 10],
    filename: `relatorio_cabo_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).outputPdf('blob');
}

// ==========================================
// EXPORTAÇÃO PDF - DISJUNTOR
// ==========================================

export async function exportBreakerPDF(data: {
  loadCurrent_A: number;
  loadType: string;
  cableMaxCurrent_A: number;
  In_A: number;
  curve: string;
  coordinationOk: boolean;
  tag?: string;
  client?: string;
  operator?: string;
}): Promise<Blob> {
  const coordColor = data.coordinationOk ? '#22c55e' : '#ef4444';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
      <div style="text-align:center;border-bottom:3px solid #6366f1;padding-bottom:16px;margin-bottom:20px;">
        <h1 style="font-size:22px;color:#6366f1;margin:0;">RELATÓRIO DE TESTE DE DISJUNTOR</h1>
        <p style="color:#6b7280;font-size:12px;margin-top:4px;">EletriLab - Relatório de Qualidade</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">TAG</strong><br/>${data.tag || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">CLIENTE</strong><br/>${data.client || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">OPERADOR</strong><br/>${data.operator || 'N/A'}</div>
        <div style="flex:1;min-width:120px;"><strong style="color:#6b7280;font-size:11px;">DATA</strong><br/>${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="text-align:left;padding:10px;border:1px solid #d1d5db;font-size:13px;">Parâmetro</th>
            <th style="text-align:right;padding:10px;border:1px solid #d1d5db;font-size:13px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Corrente de Carga</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.loadCurrent_A} A</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Tipo de Carga</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.loadType}</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Corrente Máx. Cabo</td><td style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;">${data.cableMaxCurrent_A || 'N/A'} A</td></tr>
        </tbody>
      </table>
      <div style="text-align:center;padding:20px;border-radius:12px;background:#eef2ff;border:2px solid #6366f1;margin-bottom:16px;">
        <p style="font-size:14px;color:#6b7280;margin:0 0 4px;">Disjuntor Recomendado</p>
        <p style="font-size:28px;font-weight:bold;color:#6366f1;margin:0;">${data.In_A} A - Curva ${data.curve}</p>
      </div>
      <div style="text-align:center;padding:12px;border-radius:8px;background:${coordColor}10;border:1px solid ${coordColor};">
        <span style="font-weight:bold;color:${coordColor};">${data.coordinationOk ? '✓ Coordenação OK: Idj ≤ Icabo' : '✗ Coordenação inválida: Idj > Icabo'}</span>
      </div>
      <p style="text-align:center;font-size:10px;color:#9ca3af;margin-top:24px;">Gerado por EletriLab</p>
    </div>`;

  return await html2pdf().from(html).set({
    margin: [10, 10, 10, 10],
    filename: `relatorio_disjuntor_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).outputPdf('blob');
}


/**
 * Exporta Laudo A4 Profissional com conformidade NR-10 / NBR 5410
 */
export async function exportA4ProfissionalPDF(
  report: IRReport,
  meta: {
    empresa?: string;
    crea?: string;
    responsavel?: string;
    logoUrl?: string;
  } = {}
): Promise<Blob> {
  const html = generateA4ProfissionalHTML(report, meta);

  return await html2pdf().from(html).set({
    margin: [15, 15, 20, 15],
    filename: `laudo_${report.category}_${report.tag || 'sem-tag'}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    pagebreak: { mode: ['avoid-all', 'css'] }
  }).outputPdf('blob');
}

function generateA4ProfissionalHTML(
  report: IRReport,
  meta: { empresa?: string; crea?: string; responsavel?: string; logoUrl?: string }
): string {
  const empresa = meta.empresa || 'Nome da Empresa';
  const responsavel = meta.responsavel || report.operator || 'Técnico Responsável';
  const crea = meta.crea || '';
  const dataBR = new Date().toLocaleDateString('pt-BR');
  const tag = report.tag || '-';
  const client = report.client || '-';
  const site = report.site || '-';
  const status = report.dai && parseFloat(report.dai) >= 1.3 ? 'APROVADO' : 'REPROVADO';
  const statusColor = status === 'APROVADO' ? '#16a34a' : '#dc2626';

  const readings = (report.readings || [])
    .map(
      (r, i) =>
        `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${String(i + 1).padStart(2, '0')}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${r.time}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${r.kv} kV</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${r.resistance}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
  .page { width: 100%; padding: 0; }
  /* Cabeçalho */
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .logo-box { width: 56px; height: 56px; border: 2px solid #1e40af; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #1e40af; font-size: 9px; font-weight: bold; text-align: center; }
  .company-name { font-size: 16px; font-weight: bold; color: #1e40af; }
  .company-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .header-right { text-align: right; }
  .report-number { font-size: 13px; font-weight: bold; color: #1e40af; }
  .report-date { font-size: 10px; color: #6b7280; margin-top: 3px; }
  /* Norma badge */
  .norm-bar { display: flex; gap: 8px; margin-bottom: 14px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 9px; font-weight: bold; letter-spacing: .5px; }
  .badge-nr10 { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
  .badge-nbr { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }
  /* Info grid */
  .section-title { font-size: 10px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; border-bottom: 1px solid #dbeafe; padding-bottom: 3px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .info-item label { font-size: 9px; color: #6b7280; display: block; }
  .info-item span { font-size: 11px; font-weight: 600; }
  /* Tabela */
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  thead tr { background: #1e40af; color: #fff; }
  thead th { padding: 7px 10px; text-align: left; font-size: 10px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  /* DAI */
  .dai-box { display: flex; align-items: center; gap: 16px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
  .dai-value { font-size: 22px; font-weight: bold; color: #1e40af; }
  .dai-label { font-size: 10px; color: #6b7280; }
  .status-badge { display: inline-block; padding: 5px 16px; border-radius: 6px; font-size: 13px; font-weight: bold; color: #fff; margin-left: auto; }
  /* NR-10 */
  .norm-box { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 10px 12px; margin-bottom: 14px; border-radius: 0 6px 6px 0; }
  .norm-box strong { color: #92400e; }
  .norm-box p { color: #78350f; font-size: 10px; margin-top: 4px; }
  /* Assinatura */
  .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 24px; padding-top: 14px; border-top: 1px solid #e5e7eb; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #374151; margin-bottom: 5px; }
  .sig-name { font-size: 10px; font-weight: bold; }
  .sig-role { font-size: 9px; color: #6b7280; }
  .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>
<div class="page">
  <!-- Cabeçalho -->
  <div class="header">
    <div class="header-left">
      <div class="logo-box">LOGO</div>
      <div>
        <div class="company-name">${empresa}</div>
        <div class="company-sub">Ensaios e Laudos Elétricos</div>
      </div>
    </div>
    <div class="header-right">
      <div class="report-number">LAUDO Nº ${report.id?.slice(-6)?.toUpperCase() || 'N/A'}</div>
      <div class="report-date">Data: ${dataBR}</div>
    </div>
  </div>

  <!-- Badges de norma -->
  <div class="norm-bar">
    <span class="badge badge-nr10">NR-10 — Segurança em Instalações Elétricas</span>
    <span class="badge badge-nbr">NBR 5410 — Instalações de Baixa Tensão</span>
  </div>

  <!-- Dados do ensaio -->
  <div class="section-title">Identificação do Equipamento</div>
  <div class="info-grid">
    <div class="info-item"><label>TAG / Equipamento</label><span>${tag}</span></div>
    <div class="info-item"><label>Cliente</label><span>${client}</span></div>
    <div class="info-item"><label>Local / Planta</label><span>${site}</span></div>
    <div class="info-item"><label>Categoria</label><span>${report.category}</span></div>
    <div class="info-item"><label>Tensão de Ensaio</label><span>${(report.readings?.[0]?.kv ?? '-')} kV</span></div>
    <div class="info-item"><label>Técnico Responsável</label><span>${responsavel}${crea ? ' — CREA ' + crea : ''}</span></div>
  </div>

  <!-- Leituras -->
  <div class="section-title">Leituras de Resistência de Isolamento</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Tempo</th>
        <th>Tensão</th>
        <th>Resistência</th>
      </tr>
    </thead>
    <tbody>${readings}</tbody>
  </table>

  <!-- DAI e Status -->
  <div class="dai-box">
    <div>
      <div class="dai-label">Índice de Absorção (DAI)</div>
      <div class="dai-value">${report.dai}</div>
    </div>
    <div style="padding-left:14px;border-left:1px solid #e5e7eb;">
      <div class="dai-label">Critério: DAI ≥ 1,3 (Aprovado)</div>
      <div style="font-size:11px;color:#374151;margin-top:2px;">Conforme NBR 5460 / IEEE 43</div>
    </div>
    <div class="status-badge" style="background:${statusColor};">${status}</div>
  </div>

  <!-- NR-10 -->
  <div class="norm-box">
    <strong>Conformidade NR-10 — Segurança em Instalações e Serviços em Eletricidade</strong>
    <p>
      Este laudo foi elaborado por profissional habilitado conforme exigência da NR-10 (Portaria MTE 598/2004 e atualizações).
      Os ensaios de resistência de isolamento atendem ao item 10.8.2 da norma, que estabelece a obrigatoriedade
      de verificação periódica das condições de isolação em instalações elétricas. Equipamentos de proteção
      individual e coletiva foram utilizados durante a execução do ensaio.
    </p>
  </div>

  <!-- Assinatura -->
  <div class="signature-section">
    <div class="sig-block">
      <div style="height:40px;"></div>
      <div class="sig-line"></div>
      <div class="sig-name">${responsavel}</div>
      <div class="sig-role">Técnico Responsável${crea ? ' — CREA ' + crea : ''}</div>
    </div>
    <div class="sig-block">
      <div style="height:40px;"></div>
      <div class="sig-line"></div>
      <div class="sig-name">Cliente / Responsável</div>
      <div class="sig-role">Aprovação do Laudo</div>
    </div>
  </div>

  <div class="footer">
    Documento gerado pelo EletriLab · ${dataBR} · Este laudo é válido apenas com assinatura e carimbo do responsável técnico.
  </div>
</div>
</body>
</html>`;
}
