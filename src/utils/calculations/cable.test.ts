import { describe, expect, test } from 'vitest'
import { calculateCable, calculateCurrent } from './cable'

describe('cable calculations', () => {
  test('calculateCurrent computes monofásico current', () => {
    const I = calculateCurrent(2200, 220, 1, 'monofasico')
    expect(I).toBeCloseTo(10, 6)
  })

  test('calculateCable returns invalid for missing inputs', () => {
    const r = calculateCable({
      power: 0,
      voltage: 220,
      powerFactor: 1,
      systemType: 'monofasico',
      distance: 10,
      voltageDropPercent: 4
    })
    expect(r.status).toBe('entrada_invalida')
  })
})

