export function formatResistance(valueOhms: number, limitTOhm = 5): string {
  const limit = limitTOhm * 1e12; // 5 TΩ
  if (valueOhms >= limit) return "0.99 OVRG";

  if (valueOhms < 1e3)  return `${valueOhms.toFixed(0)}Ω`;
  if (valueOhms < 1e6)  return `${(valueOhms/1e3).toFixed(2)}kΩ`;
  if (valueOhms < 1e9)  return `${(valueOhms/1e6).toFixed(2)}MΩ`;
  if (valueOhms < 1e12) return `${(valueOhms/1e9).toFixed(2)}GΩ`;
  return `${(valueOhms/1e12).toFixed(2)}TΩ`;
}

// Ex.: "5 MΩ" -> 5_000_000
export function parseResistance(input: string): number {
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


