import { useRef, useState } from 'react';
import { exportCupomCSV, exportCupomPDF } from '../utils/export';
import { Category, CupomReport, gerarSerieIR } from '../utils/generator';

export default function GenerateReport() {
  const [category, setCategory] = useState<Category>('cabo');
  const [kv, setKv] = useState<number>(1.0);
  const [manufacturer, setManufacturer] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [report, setReport] = useState<CupomReport | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    const r = gerarSerieIR({
      category,
      kv,
      model: model || undefined,
      unit_id: unitId || undefined
    });
    setReport(r);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerar Relatório (Rápido)</h1>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Categoria *</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              <option value="cabo">Cabo</option>
              <option value="motor">Motor</option>
              <option value="bomba">Bomba</option>
              <option value="trafo">Trafo</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="label">Tensão (kV) *</label>
            <input
              type="number"
              step="0.01"
              min={0.1}
              className="input"
              value={kv}
              onChange={(e) => setKv(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="label">Fabricante (opcional)</label>
            <input type="text" className="input" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </div>

          <div>
            <label className="label">Modelo (opcional)</label>
            <input type="text" className="input" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>

          <div>
            <label className="label">Unit ID (opcional)</label>
            <input type="text" className="input" value={unitId} onChange={(e) => setUnitId(e.target.value)} />
          </div>
        </div>

        <div className="mt-6">
          <button type="button" className="btn-primary" onClick={handleGenerate}>
            Gerar Valores
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-4">
          <div
            ref={previewRef}
            className="mx-auto"
            style={{
              width: 280,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              background: 'white',
              color: 'black',
              padding: 12,
              borderRadius: 6,
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 700 }}>RELATÓRIO IR - PREVIEW</div>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              {manufacturer && <div>Fabricante: {manufacturer}</div>}
              {model && <div>Modelo: {model}</div>}
              {unitId && <div>Unit ID: {unitId}</div>}
            </div>
            <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontWeight: 600 }}>
              <div>Tempo</div>
              <div>kV</div>
              <div>Ohms</div>
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {report.lines.map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  <div>{l.t}</div>
                  <div>{l.kv}</div>
                  <div>{l.ohms}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, marginTop: 8, fontWeight: 700 }}>DAI: {report.dai}</div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (!previewRef.current) return;
                exportCupomPDF(previewRef.current);
              }}
            >
              Exportar PDF
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => exportCupomCSV(report)}
            >
              Exportar CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


