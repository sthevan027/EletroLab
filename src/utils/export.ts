import html2pdf from 'html2pdf.js';
import { Report, Test, Equipment, ExportOptions } from '../types';
import { formatDate, formatDateTime, formatTestValue } from './validation';

// Função para exportar relatório em PDF
export async function exportReportToPDF(
  report: Report,
  tests: Test[],
  equipment: Equipment[],
  options: ExportOptions
): Promise<void> {
  try {
    // Criar elemento HTML para o PDF
    const pdfElement = document.createElement('div');
    pdfElement.className = 'pdf-container';
    pdfElement.style.cssText = `
      font-family: 'Inter', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      color: black;
    `;

    // Cabeçalho do relatório
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
        <h1 style="color: #3b82f6; margin: 0; font-size: 24px; font-weight: 600;">EletriLab</h1>
        <h2 style="color: #1f2937; margin: 10px 0 0 0; font-size: 18px; font-weight: 500;">Relatório de Ensaios Elétricos</h2>
      </div>
    `;
    pdfElement.appendChild(header);

    // Informações do relatório
    const reportInfo = document.createElement('div');
    reportInfo.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Informações do Relatório</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500; width: 150px;">Número:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${report.number}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Data:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${formatDate(report.date)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Cliente:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${report.client}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Local:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${report.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Responsável:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${report.responsible}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Status:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                ${report.status === 'aprovado' ? 'background: #dcfce7; color: #166534;' : ''}
                ${report.status === 'reprovado' ? 'background: #fee2e2; color: #991b1b;' : ''}
                ${report.status === 'finalizado' ? 'background: #dbeafe; color: #1e40af;' : ''}
                ${report.status === 'rascunho' ? 'background: #fef3c7; color: #92400e;' : ''}
              ">${report.status.toUpperCase()}</span>
            </td>
          </tr>
        </table>
      </div>
    `;
    pdfElement.appendChild(reportInfo);

    // Tabela de testes
    if (options.includeTests && tests.length > 0) {
      const testsSection = document.createElement('div');
      testsSection.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Resultados dos Ensaios</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Equipamento</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Tipo</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; font-weight: 600;">Valor</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; font-weight: 600;">Resultado</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Data</th>
              </tr>
            </thead>
            <tbody>
              ${tests.map(test => {
                const equip = equipment.find(e => e.id === test.equipmentId);
                return `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${equip ? equip.tag : 'N/A'}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${test.testType.toUpperCase()}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${formatTestValue(test.value, test.unit)}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">
                      <span style="
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 500;
                        ${test.result === 'BOM' ? 'background: #dcfce7; color: #166534;' : ''}
                        ${test.result === 'ACEITÁVEL' ? 'background: #fef3c7; color: #92400e;' : ''}
                        ${test.result === 'REPROVADO' ? 'background: #fee2e2; color: #991b1b;' : ''}
                      ">${test.result}</span>
                    </td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${formatDate(test.performedAt)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      pdfElement.appendChild(testsSection);
    }

    // Observações e recomendações
    if (report.observations || report.recommendations) {
      const observationsSection = document.createElement('div');
      observationsSection.innerHTML = `
        <div style="margin-bottom: 30px;">
          ${report.observations ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Observações</h3>
              <p style="margin: 0; line-height: 1.6; color: #4b5563;">${report.observations}</p>
            </div>
          ` : ''}
          ${report.recommendations ? `
            <div>
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Recomendações</h3>
              <p style="margin: 0; line-height: 1.6; color: #4b5563;">${report.recommendations}</p>
            </div>
          ` : ''}
        </div>
      `;
      pdfElement.appendChild(observationsSection);
    }

    // Rodapé
    const footer = document.createElement('div');
    footer.innerHTML = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Relatório gerado em ${formatDateTime(new Date().toISOString())}</p>
        <p style="margin: 5px 0 0 0;">EletriLab - Sistema de Ensaios Elétricos</p>
      </div>
    `;
    pdfElement.appendChild(footer);

    // Configurações do PDF
    const pdfOptions = {
      margin: [10, 10, 10, 10],
      filename: `relatorio_${report.number}_${formatDate(report.date)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gerar PDF
    await html2pdf().from(pdfElement).set(pdfOptions).save();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF do relatório');
  }
}

// Função para exportar dados em CSV
export function exportDataToCSV(
  data: (Report | Test | Equipment)[],
  filename: string,
  headers: string[]
): void {
  try {
    // Converter dados para CSV
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if ('number' in item) {
          // Report
          return [
            item.number,
            formatDate(item.date),
            item.client,
            item.location,
            item.responsible,
            item.status
          ].join(',');
        } else if ('testType' in item) {
          // Test
          return [
            item.testType,
            item.value.toString(),
            item.unit,
            item.result,
            formatDate(item.performedAt),
            item.performedBy
          ].join(',');
        } else {
          // Equipment
          return [
            item.tag,
            item.category,
            item.description,
            item.location,
            item.manufacturer,
            item.model,
            item.status
          ].join(',');
        }
      })
    ].join('\n');

    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    throw new Error('Falha ao exportar dados em CSV');
  }
}

// Função para exportar relatórios em CSV
export function exportReportsToCSV(reports: Report[]): void {
  const headers = ['Número', 'Data', 'Cliente', 'Local', 'Responsável', 'Status'];
  exportDataToCSV(reports, 'relatorios', headers);
}

// Função para exportar testes em CSV
export function exportTestsToCSV(tests: Test[]): void {
  const headers = ['Tipo', 'Valor', 'Unidade', 'Resultado', 'Data', 'Responsável'];
  exportDataToCSV(tests, 'testes', headers);
}

// Função para exportar equipamentos em CSV
export function exportEquipmentToCSV(equipment: Equipment[]): void {
  const headers = ['Tag', 'Categoria', 'Descrição', 'Localização', 'Fabricante', 'Modelo', 'Status'];
  exportDataToCSV(equipment, 'equipamentos', headers);
}

// Função para exportar dados filtrados
export function exportFilteredData(
  data: (Report | Test | Equipment)[],
  filters: any,
  dataType: 'reports' | 'tests' | 'equipment'
): void {
  try {
    let filteredData = [...data];

    // Aplicar filtros de data se existirem
    if (filters.dateRange) {
      filteredData = filteredData.filter(item => {
        const itemDate = 'date' in item ? item.date : 'performedAt' in item ? item.performedAt : item.createdAt;
        const date = new Date(itemDate);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        return date >= start && date <= end;
      });
    }

    // Aplicar filtros de status se existirem
    if (filters.status && filters.status.length > 0) {
      filteredData = filteredData.filter(item => {
        const status = 'status' in item ? item.status : 'result' in item ? item.result : null;
        return status && filters.status.includes(status);
      });
    }

    // Exportar dados filtrados
    switch (dataType) {
      case 'reports':
        exportReportsToCSV(filteredData as Report[]);
        break;
      case 'tests':
        exportTestsToCSV(filteredData as Test[]);
        break;
      case 'equipment':
        exportEquipmentToCSV(filteredData as Equipment[]);
        break;
    }
  } catch (error) {
    console.error('Erro ao exportar dados filtrados:', error);
    throw new Error('Falha ao exportar dados filtrados');
  }
}
