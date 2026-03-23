import * as XLSX from 'xlsx';
import { IRReport, MultiPhaseReport } from '../types';

function downloadExcel(wb: XLSX.WorkBook, filename: string) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMeggerExcel(report: IRReport) {
  const wb = XLSX.utils.book_new();

  const header = [
    ['RELATÓRIO DE MEGGER / RESISTÊNCIA DE ISOLAMENTO'],
    [],
    ['Categoria', report.category.toUpperCase()],
    ['Tag', report.tag || 'N/A'],
    ['Tensão Aplicada', `${report.kv} kV`],
    ['Cliente', report.client || 'N/A'],
    ['Local', report.site || 'N/A'],
    ['Operador', report.operator || 'N/A'],
    ['Fabricante', report.manufacturer || 'N/A'],
    ['Modelo', report.model || 'N/A'],
    ['Data', report.createdAt instanceof Date ? report.createdAt.toLocaleDateString('pt-BR') : String(report.createdAt)],
    [],
    ['Tempo', 'Tensão (kV)', 'Resistência'],
  ];

  const rows = report.readings.map(r => [r.time, r.kv, r.resistance]);
  const footer = [[], ['DAI', report.dai], [], ['Gerado por EletriLab']];

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, ...footer]);
  ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Megger');

  const ts = new Date().toISOString().split('T')[0];
  downloadExcel(wb, `relatorio_megger_${report.category}_${ts}.xlsx`);
}

export function exportMicrohmExcel(data: {
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
}) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ['RELATÓRIO DE MICROHMÍMETRO'],
    [],
    ['Tag', data.tag || 'N/A'],
    ['Cliente', data.client || 'N/A'],
    ['Operador', data.operator || 'N/A'],
    ['Data', data.date || new Date().toLocaleDateString('pt-BR')],
    [],
    ['PARÂMETROS DE ENTRADA'],
    ['Tensão Aplicada (V)', data.voltage_V],
    ['Corrente Medida (A)', data.current_A],
    ['Referência (Ω)', data.reference_Ohm],
    [],
    ['RESULTADOS'],
    ['R Medida (Ω)', data.R_Ohm],
    ['Desvio (%)', data.percentDelta],
    ['Status', data.status === 'ok' ? 'OK' : data.status === 'alerta' ? 'ALERTA' : 'MAU CONTATO'],
    ['Possível Mau Contato', data.possibleBadContact ? 'SIM' : 'NÃO'],
    [],
    ['Gerado por EletriLab'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Microhm');

  const ts = new Date().toISOString().split('T')[0];
  downloadExcel(wb, `relatorio_microhm_${ts}.xlsx`);
}

export function exportHipotExcel(data: {
  nominalVoltage_V: number;
  Vteste_V: number;
  formulaUsed: string;
  tag?: string;
  client?: string;
  operator?: string;
  date?: string;
}) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ['RELATÓRIO DE HI-POT'],
    [],
    ['Tag', data.tag || 'N/A'],
    ['Cliente', data.client || 'N/A'],
    ['Operador', data.operator || 'N/A'],
    ['Data', data.date || new Date().toLocaleDateString('pt-BR')],
    [],
    ['PARÂMETROS'],
    ['Tensão Nominal (V)', data.nominalVoltage_V],
    ['Fórmula', data.formulaUsed],
    [],
    ['RESULTADO'],
    ['Tensão de Teste (V)', data.Vteste_V],
    [],
    ['Gerado por EletriLab'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'HiPot');

  const ts = new Date().toISOString().split('T')[0];
  downloadExcel(wb, `relatorio_hipot_${ts}.xlsx`);
}

export function exportCableExcel(data: {
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
}) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ['RELATÓRIO DE LANÇAMENTO DE CABO'],
    [],
    ['Tag', data.tag || 'N/A'],
    ['Cliente', data.client || 'N/A'],
    ['Operador', data.operator || 'N/A'],
    ['Data', new Date().toLocaleDateString('pt-BR')],
    [],
    ['PARÂMETROS DE ENTRADA'],
    ['Potência (W)', data.power],
    ['Tensão (V)', data.voltage],
    ['Fator de Potência', data.powerFactor],
    ['Sistema', data.systemType],
    ['Distância (m)', data.distance],
    ['Queda Admitida (%)', data.voltageDropPercent],
    [],
    ['RESULTADOS'],
    ['Corrente (A)', data.current_A],
    ['Seção Mínima (mm²)', data.minSection_mm2],
    ['Resistência (Ω)', data.resistance_Ohm],
    ['Queda Real (%)', data.actualDrop],
    ['Status', data.status],
  ];

  if (data.breakerIn) {
    rows.push(
      [],
      ['DISJUNTOR'] as any,
      ['In (A)', data.breakerIn],
      ['Curva', data.breakerCurve || 'N/A'],
      ['Coordenação OK', data.coordinationOk ? 'SIM' : 'NÃO'],
    );
  }

  rows.push([], ['Gerado por EletriLab']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Cabo');

  const ts = new Date().toISOString().split('T')[0];
  downloadExcel(wb, `relatorio_cabo_${ts}.xlsx`);
}

export function exportBreakerExcel(data: {
  loadCurrent_A: number;
  loadType: string;
  cableMaxCurrent_A: number;
  In_A: number;
  curve: string;
  coordinationOk: boolean;
  tag?: string;
  client?: string;
  operator?: string;
}) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ['RELATÓRIO DE TESTE DE DISJUNTOR'],
    [],
    ['Tag', data.tag || 'N/A'],
    ['Cliente', data.client || 'N/A'],
    ['Operador', data.operator || 'N/A'],
    ['Data', new Date().toLocaleDateString('pt-BR')],
    [],
    ['PARÂMETROS'],
    ['Corrente de Carga (A)', data.loadCurrent_A],
    ['Tipo de Carga', data.loadType],
    ['Corrente Máx. Cabo (A)', data.cableMaxCurrent_A || 'N/A'],
    [],
    ['RESULTADO'],
    ['Disjuntor Recomendado (A)', data.In_A],
    ['Curva', data.curve],
    ['Coordenação OK', data.coordinationOk ? 'SIM' : 'NÃO'],
    [],
    ['Gerado por EletriLab'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Disjuntor');

  const ts = new Date().toISOString().split('T')[0];
  downloadExcel(wb, `relatorio_disjuntor_${ts}.xlsx`);
}
