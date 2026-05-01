import { describe, expect, test } from 'vitest'
import { calculateMegger } from './megger'

const baseInput = {
  gauge: 2.5,
  material: 'PVC' as const,
  length: 100,
  temperature: 20,
  humidity: 50
}

describe('calculateMegger', () => {
  test('Rmin_MOhm segue 1/L_km (norma)', () => {
    const r500 = calculateMegger({ ...baseInput, length: 500 })
    expect(r500.Rmin_MOhm).toBeCloseTo(1 / 0.5, 6)

    const r1000 = calculateMegger({ ...baseInput, length: 1000 })
    expect(r1000.Rmin_MOhm).toBeCloseTo(1, 6)
  })

  test('XLPE produz resistência maior que PVC para mesma bitola e comprimento', () => {
    const pvc = calculateMegger({ ...baseInput, material: 'PVC' })
    const xlpe = calculateMegger({ ...baseInput, material: 'XLPE' })
    expect(xlpe.R_MOhm).toBeGreaterThan(pvc.R_MOhm)
  })

  test('a 20°C e 50% UR, fatores FT e FH unitários nos detalhes', () => {
    const r = calculateMegger({ ...baseInput, temperature: 20, humidity: 50 })
    expect(r.details.FT).toBeCloseTo(1, 6)
    expect(r.details.FH).toBeCloseTo(1, 6)
  })

  test('Rmin aplica piso de L_km = 0,001 km (máx. 1000 MΩ no denominador)', () => {
    const r = calculateMegger({ ...baseInput, length: 0.0005 })
    expect(r.details.L_km).toBeCloseTo(0.000001, 9)
    expect(r.Rmin_MOhm).toBeCloseTo(1000, 6)
  })

  test('bitola zero anula Ri e resulta em Reprovado', () => {
    const r = calculateMegger({
      ...baseInput,
      gauge: 0,
      length: 10
    })
    expect(r.R_MOhm).toBe(0)
    expect(r.status).toBe('Reprovado')
  })

  test('trecho longo reduz Rmin e tende a Aprovado com mesma bitola', () => {
    const r = calculateMegger({ ...baseInput, length: 5000 })
    expect(r.Rmin_MOhm).toBeCloseTo(0.2, 6)
    expect(r.status).toBe('Aprovado')
  })
})
