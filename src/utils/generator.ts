import { formatResistance } from './units';

export type Category = 'cabo' | 'motor' | 'bomba' | 'trafo' | 'outro';
export type CupomLine = { t: string; kv: string; ohms: string };
export type CupomReport = {
  header: { model?: string; unit_id?: string; test_no: number; timestamp: string };
  lines: CupomLine[];
  dai: string; // "1.98" | "Undefined"
};

const times = ['00:15', '00:30', '00:45', '01:00'];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const profiles = {
  cabo: { baseG: [5, 20], growth: [1.05, 1.18] },
  motor: { baseG: [1, 5], growth: [1.03, 1.12] },
  bomba: { baseG: [1, 5], growth: [1.03, 1.12] },
  trafo: { baseG: [10, 50], growth: [1.05, 1.18] },
  outro: { baseG: [0.5, 5], growth: [1.02, 1.10] }
} as const;

function parseFormatted(s: string): number | undefined {
  if (s.includes('OVRG')) return undefined;
  if (s.endsWith('TΩ')) return Number(s.replace('TΩ', '')) * 1e12;
  if (s.endsWith('GΩ')) return Number(s.replace('GΩ', '')) * 1e9;
  if (s.endsWith('MΩ')) return Number(s.replace('MΩ', '')) * 1e6;
  if (s.endsWith('kΩ')) return Number(s.replace('kΩ', '')) * 1e3;
  if (s.endsWith('Ω')) return Number(s.replace('Ω', ''));
  return Number(s);
}

/** Série IR (R15/30/45/60). Cabo: força >= 5 GΩ. OVRG >= 5 TΩ. */
export function gerarSerieIR(opts: {
  category: Category;
  kv?: number; // default 1.00
  limitTOhm?: number; // default 5 TΩ
  model?: string;
  unit_id?: string; // opcionais
}): CupomReport {
  const { category, kv = 1.0, limitTOhm = 5, model, unit_id } = opts;
  const p = profiles[category];

  let r15G = rnd(p.baseG[0], p.baseG[1]);
  let r30G = r15G * rnd(p.growth[0], p.growth[1]);
  let r45G = r30G * rnd(p.growth[0], p.growth[1]);
  let r60G = r45G * rnd(p.growth[0], p.growth[1]);

  if (category === 'cabo') {
    r15G = Math.max(r15G, 5);
    r30G = Math.max(r30G, 5);
    r45G = Math.max(r45G, 5);
    r60G = Math.max(r60G, 5);
  }

  const asOhms = (g: number) => g * 1e9;
  const kvStr = kv.toFixed(2);

  const lines: CupomLine[] = [
    { t: times[0], kv: kvStr, ohms: formatResistance(asOhms(r15G), limitTOhm) },
    { t: times[1], kv: kvStr, ohms: formatResistance(asOhms(r30G), limitTOhm) },
    { t: times[2], kv: kvStr, ohms: formatResistance(asOhms(r45G), limitTOhm) },
    { t: times[3], kv: kvStr, ohms: formatResistance(asOhms(r60G), limitTOhm) }
  ];

  const n30 = parseFormatted(lines[1].ohms);
  const n60 = parseFormatted(lines[3].ohms);
  const dai = !n30 || !n60 ? 'Undefined' : (n60 / n30).toFixed(2);

  return {
    header: {
      model,
      unit_id,
      test_no: Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString()
    },
    lines,
    dai
  };
}


