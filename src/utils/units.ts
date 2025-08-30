/**
 * Utilitárias para formatação e conversão de unidades de resistência
 */

/**
 * Formata um valor de resistência em ohms para a unidade apropriada
 * @param valueOhms - Valor em ohms
 * @param limitTOhms - Limite OVRG em TΩ (padrão: 5)
 * @returns String formatada (ex: "5.23GΩ", "0.99 OVRG")
 */
export function formatResistance(valueOhms: number, limitTOhms = 5): string {
  const limit = limitTOhms * 1e12; // 5 TΩ
  
  // Verificar se está no limite OVRG
  if (valueOhms >= limit) {
    return "0.99 OVRG";
  }

  // Formatação por faixa de valores
  if (valueOhms < 1e3) {
    return `${valueOhms.toFixed(0)}Ω`;
  }
  
  if (valueOhms < 1e6) {
    return `${(valueOhms / 1e3).toFixed(2)}kΩ`;
  }
  
  if (valueOhms < 1e9) {
    return `${(valueOhms / 1e6).toFixed(2)}MΩ`;
  }
  
  if (valueOhms < 1e12) {
    return `${(valueOhms / 1e9).toFixed(2)}GΩ`;
  }
  
  return `${(valueOhms / 1e12).toFixed(2)}TΩ`;
}

/**
 * Converte uma string de resistência formatada para valor em ohms
 * @param resistance - String formatada (ex: "5.23GΩ", "0.99 OVRG")
 * @returns Valor em ohms ou undefined se OVRG
 */
export function parseResistance(resistance: string): number | undefined {
  if (resistance.includes('OVRG')) {
    return undefined;
  }

  const patterns = [
    { regex: /^(\d+)Ω$/, multiplier: 1 },
    { regex: /^(\d+\.\d{2})kΩ$/, multiplier: 1e3 },
    { regex: /^(\d+\.\d{2})MΩ$/, multiplier: 1e6 },
    { regex: /^(\d+\.\d{2})GΩ$/, multiplier: 1e9 },
    { regex: /^(\d+\.\d{2})TΩ$/, multiplier: 1e12 }
  ];

  for (const pattern of patterns) {
    const match = resistance.match(pattern.regex);
    if (match) {
      return parseFloat(match[1]) * pattern.multiplier;
    }
  }

  return undefined;
}

/**
 * Converte um valor de uma unidade para outra
 * @param value - Valor a ser convertido
 * @param fromUnit - Unidade de origem
 * @param toUnit - Unidade de destino
 * @returns Valor convertido
 */
export function convertResistance(value: number, fromUnit: string, toUnit: string): number {
  const units = {
    'Ω': 1,
    'kΩ': 1e3,
    'MΩ': 1e6,
    'GΩ': 1e9,
    'TΩ': 1e12
  };

  const fromMultiplier = units[fromUnit as keyof typeof units] || 1;
  const toMultiplier = units[toUnit as keyof typeof units] || 1;

  const valueInOhms = value * fromMultiplier;
  return valueInOhms / toMultiplier;
}

/**
 * Valida se um valor de resistência está dentro dos limites esperados para uma categoria
 * @param valueOhms - Valor em ohms
 * @param category - Categoria do equipamento
 * @param minGoodG - Valor mínimo bom em GΩ
 * @returns Objeto com validação e classificação
 */
export function validateResistanceValue(
  valueOhms: number, 
  category: string, 
  minGoodG: number
): { isValid: boolean; classification: 'BOM' | 'ACEITÁVEL' | 'REPROVADO'; message: string } {
  const valueG = valueOhms / 1e9;
  
  if (valueG >= minGoodG) {
    return {
      isValid: true,
      classification: 'BOM',
      message: `Valor ${formatResistance(valueOhms)} está dentro dos limites aceitáveis`
    };
  }
  
  if (valueG >= minGoodG * 0.5) {
    return {
      isValid: true,
      classification: 'ACEITÁVEL',
      message: `Valor ${formatResistance(valueOhms)} está abaixo do ideal mas ainda aceitável`
    };
  }
  
  return {
    isValid: false,
    classification: 'REPROVADO',
    message: `Valor ${formatResistance(valueOhms)} está abaixo do mínimo aceitável`
  };
}

/**
 * Calcula o DAI (Dielectric Absorption Index) baseado nas leituras
 * @param readings - Array de leituras com resistência
 * @returns Valor do DAI ou "Undefined" se não puder ser calculado
 */
export function calculateDAI(readings: { resistance: string }[]): string {
  if (readings.length < 4) {
    return "Undefined";
  }

  const r30 = parseResistance(readings[1].resistance); // 00:30
  const r60 = parseResistance(readings[3].resistance); // 01:00

  if (r30 === undefined || r60 === undefined || r30 === 0) {
    return "Undefined";
  }

  const dai = r60 / r30;
  return dai.toFixed(2);
}

/**
 * Formata um valor de tensão para o formato padrão
 * @param kv - Valor em kV
 * @returns String formatada (ex: "1.00")
 */
export function formatVoltage(kv: number): string {
  return kv.toFixed(2);
}

/**
 * Formata um tempo para o formato padrão
 * @param minutes - Tempo em minutos
 * @returns String formatada (ex: "00:15")
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Converte tempo formatado para minutos
 * @param timeString - String formatada (ex: "00:15")
 * @returns Tempo em minutos
 */
export function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Gera a série de tempos padrão para testes IR
 * @returns Array com os tempos padrão
 */
export function getStandardTimeSeries(): string[] {
  return ['00:15', '00:30', '00:45', '01:00'];
}

/**
 * Converte a série de tempos para minutos
 * @returns Array com os tempos em minutos
 */
export function getStandardTimeMinutes(): number[] {
  return [15, 30, 45, 60];
}

// Função alternativa de parseamento (para compatibilidade)
export function parseResistanceFromInput(input: string): number {
  if (!input) return 0;
  const m = String(input).trim().match(/^([\d.,]+)\s*(t?g?m?k?)? ?(ohm|Ω)?$/i);
  if (!m) return Number(input) || 0;
  const raw = m[1].replace('.', '').replace(',', '.'); // BR para ponto
  const num = parseFloat(raw);
  const u = (m[2] || '').toLowerCase();
  const mul =
    u === 'k' ? 1e3 :
    u === 'm' ? 1e6 :
    u === 'g' ? 1e9 :
    u === 't' ? 1e12 : 1;
  return num * mul;
}


