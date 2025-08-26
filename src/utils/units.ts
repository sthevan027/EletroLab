export function formatResistance(valueOhms: number, limitTOhm = 5): string {
  const limit = limitTOhm * 1e12; // 5 TΩ
  if (valueOhms >= limit) return "0.99 OVRG";

  if (valueOhms < 1e3)  return `${valueOhms.toFixed(0)}Ω`;
  if (valueOhms < 1e6)  return `${(valueOhms/1e3).toFixed(2)}kΩ`;
  if (valueOhms < 1e9)  return `${(valueOhms/1e6).toFixed(2)}MΩ`;
  if (valueOhms < 1e12) return `${(valueOhms/1e9).toFixed(2)}GΩ`;
  return `${(valueOhms/1e12).toFixed(2)}TΩ`;
}


