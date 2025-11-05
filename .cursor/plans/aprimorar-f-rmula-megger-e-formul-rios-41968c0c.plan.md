<!-- 41968c0c-b80c-421b-b1a7-902363786d69 e3c71116-097c-43e8-8948-8f81eb6ea7a4 -->
# Simulador Físico Realista Megger - EletroLab

## Objetivo

Implementar o modo "Simulador Físico Realista" no sistema de geração de relatórios de Megger, que:

- Calcula a resistência de isolamento (Ri) usando a fórmula física real
- Gera valores realistas em GΩ/TΩ com base no comprimento, bitola e material do cabo
- Exibe os resultados automaticamente formatados como no modelo real de relatório (ex: Fase R–S = 1.25 GΩ)

## Fórmula Física Base (Ri)

```
Ri (MΩ) = (Ki × ln(D/d)) / L_km
```

**Unidades e parâmetros:**

- **Ki** — constante do material (MΩ·km)
  - XLPE: 3700
  - EPR: 3000
  - PVC: 2500
  - Outro: 3000
- **D** — diâmetro externo do isolamento (mm)
- **d** — diâmetro do condutor (mm)
- **L_km** — comprimento do cabo (km)

**Observação importante:** Usar logaritmo natural (ln) em todo o projeto para manter consistência com o modelo físico de isolamento cilíndrico.

## Estimativas de Diâmetro

Quando não informados:

```
d = √(4A/π)  // A = área do condutor (bitola em mm²)
D = d + 2t   // t = espessura da isolação
```

Se t não informado → estimar: `t ≈ 0.6 × (d/2)`

## Escalas Realistas

Aplicar fatores de escala para aproximar os valores físicos aos medidos com megômetro:

| Comprimento | Fator de Escala | Faixa de Valores Esperada |

|-------------|-----------------|---------------------------|

| L < 10 m | × (1000 / L) | 1–10 TΩ (ou 750 G–TΩ) |

| 10 m ≤ L < 100 m | × (100 / L) | 5–750 GΩ |

| L ≥ 100 m | × 1 | Valores diretos (MΩ–GΩ) |

## Ajustes Ambientais

Após o cálculo físico (Ri):

**Temperatura:**

```
fator_temp = 2^((20 - T)/10)
```

**Umidade:**

```
fator_umidade = (1 - 0.002 × (H - 50))
```

Limitado a -20% de perda máxima.

## Implementação

### 1. Novo Módulo: `src/utils/physics.ts`

**Funções principais:**

- `getInsulationConstant(material: string): number`
  - Retorna Ki baseado no material (XLPE: 3700, EPR: 3000, PVC: 2500, Outro: 3000)

- `estimateDiametersFromGauge(gauge: number, d?: number, t?: number): {d: number, D: number}`
  - Estima d e D a partir da bitola quando não informados
  - d = √(4A/π) onde A = gauge (mm²)
  - t ≈ 0.6 × (d/2) se não informado
  - D = d + 2t

- `calculatePhysicalResistance(Ki: number, D: number, d: number, L: number): number`
  - Calcula Ri usando: Ri = (Ki × ln(D/d)) / L_km
  - Retorna valor em MΩ

- `scaleResistanceForLength(Ri: number, L: number): number`
  - Aplica fatores de escala conforme comprimento:
    - L < 10m: × (1000 / L)
    - 10m ≤ L < 100m: × (100 / L)
    - L ≥ 100m: × 1
  - Retorna valor escalado em MΩ

- `applyEnvironmentalAdjustments(Ri: number, temperature: number, humidity: number): number`
  - Aplica ajustes de temperatura: Ri × 2^((20 - T)/10)
  - Aplica ajustes de umidade: Ri × (1 - 0.002 × (H - 50))
  - Limita perda máxima de -20%

- `calculateHybridResistance(options: PhysicalCableOptions, environmentalFactors: EnvironmentalFactors): number`
  - Combina todas as funções acima
  - Retorna valor final em MΩ (será convertido para GΩ/TΩ na formatação)

### 2. Estender Tipos (`src/types/index.ts`)

Adicionar em `IRGenerationOptions`:

```typescript
cableLength?: number;        // metros
cableGauge?: number;         // bitola em mm²
insulationMaterial?: 'XLPE' | 'EPR' | 'PVC' | 'outro';
conductorDiameter?: number;  // mm, opcional
insulationThickness?: number; // mm, opcional
```

Adicionar interface:

```typescript
interface PhysicalCableOptions {
  length: number;
  gauge: number;
  material: string;
  conductorDiameter?: number;
  insulationThickness?: number;
}

interface EnvironmentalFactors {
  temperature: number;  // °C
  humidity: number;     // %
}
```

### 3. Atualizar Generator (`src/utils/generator.ts`)

**Modificar `gerarSerieIR()`:**

- Verificar se tem dados físicos do cabo (comprimento + bitola + material)
- Se tiver: chamar `calculateHybridResistance()` para obter valor base
- Se não tiver: usar modo simplificado (IA/perfil)
- Aplicar decaimento temporal sobre o valor calculado
- Formatizar automaticamente em GΩ ou TΩ usando `formatResistance()`

**Atualizar `generateMultiPhaseReport()`:**

- Usar cálculo físico para gerar valores base para cada fase
- Aplicar variações realistas entre fases (fase-fase ~10% maior que fase-terra)
- Retornar tabela formatada de pares de medição

### 4. Formato de Saída - Tabela de Pares de Medição

**Estrutura de retorno:**

```typescript
interface PhaseMeasurement {
  pair: string;           // "Fase R – Fase S"
  resistance: string;     // "1.25 GΩ"
  status: 'Aprovado' | 'Reprovado' | 'Atenção';
}
```

**Exemplo de saída:**

| Par de medição | Resultado (GΩ) | Situação |

|----------------|-----------------|----------|

| Fase R – Fase S | 1.25 GΩ | Aprovado |

| Fase R – Fase T | 1.18 GΩ | Aprovado |

| Fase S – Fase T | 1.22 GΩ | Aprovado |

| Fase R – Terra | 0.68 GΩ | Aprovado |

| Fase S – Terra | 0.71 GΩ | Aprovado |

| Fase T – Terra | 0.70 GΩ | Aprovado |

### 5. Melhorar GenerateReport.tsx (`src/pages/GenerateReport.tsx`)

**Adicionar seção "Especificações Físicas do Cabo" (visível quando categoria = 'cabo'):**

- Campo: Comprimento (m) - obrigatório para cabos
- Campo: Bitola (mm²) - obrigatório para cabos
- Campo: Material Isolante (select: XLPE, EPR, PVC, Outro)
- Campos opcionais: 
  - Ø condutor (mm)
  - Espessura isolante (mm)
- Badge: "Simulador: Física" quando dados completos
- Preview dos valores calculados antes de gerar (mostrando se será GΩ ou TΩ)

**Melhorar labels e tooltips:**

- Explicar cada campo e sua influência no cálculo
- Mostrar fórmula sendo aplicada
- Indicar modo (Físico vs Simplificado)

### 6. Melhorar NewReport.tsx (`src/pages/NewReport.tsx`)

**Adicionar campos físicos do cabo:**

- Comprimento do cabo (m)
- Bitola (mm²)
- Material isolante
- Campos opcionais de diâmetros

**Quando preenchido:**

- Usar cálculo físico para gerar valores em GΩ/TΩ
- Melhorar organização visual dos campos
- Adicionar ajuda contextual

### 7. Atualizar AI Engine (`src/utils/ai-engine.ts`)

**Modificar `predictValues()`:**

- Priorizar cálculo físico quando dados disponíveis
- Usar padrões históricos como fallback
- Ajustar valores padrão para serem compatíveis com GΩ/TΩ

**Ajustar `applyEnvironmentalAdjustments()`:**

- Considerar comprimento do cabo na aplicação dos ajustes

### 8. Atualizar Exportação (`src/utils/export.ts`)

**PDF/CSV deve mostrar:**

- Ri calculado (físico) - valor base antes das escalas
- Fator de escala aplicado
- Temperatura e umidade utilizadas
- Tabela final formatada com pares de medição
- Fórmula aplicada (quando modo físico)

### 9. Validações (`src/utils/validation.ts`)

**Adicionar validações:**

- Comprimento: mínimo 1m, máximo 100km
- Bitola: faixas realistas por tipo de cabo (0.5 a 500 mm²)
- Diâmetros: quando informados, devem ser coerentes com bitola
- Material: deve ser um dos valores válidos

## Exemplo Numérico Completo

**Entrada:**

- Material: XLPE
- Ki = 3700 MΩ·km
- D = 25 mm
- d = 15 mm
- L = 20 m = 0.02 km

**Cálculo:**

```
Ri = (3700 × ln(25/15)) / 0.02
Ri = (3700 × 0.5108) / 0.02
Ri = 1889.5 / 0.02
Ri = 94,475 MΩ
```

**Fator de escala (L < 100 m):**

```
fator = 100 / 20 = 5
Ri_escalado = 94,475 × 5 = 472,375 MΩ = 472.3 GΩ
```

**Resultado formatado:** 472.3 GΩ

## Critérios de Aceitação

- ✅ Cálculo físico Ri implementado corretamente usando ln
- ✅ Escalas aplicadas conforme faixa de comprimento
- ✅ Ajustes ambientais (temperatura e umidade) aplicados
- ✅ Resultados gerados em GΩ/TΩ, formatados na tabela padrão
- ✅ Formulários atualizados com campos físicos e visual "modo simulador"
- ✅ AI engine usa a física quando dados disponíveis
- ✅ Export PDF/CSV mostra todos os dados do cálculo físico
- ✅ Tabela final formatada com pares de medição
- ✅ Modo híbrido (física + simplificado) funcionando

## Arquivos a Modificar/Criar

1. `src/types/index.ts` - Estender IRGenerationOptions e adicionar interfaces
2. `src/utils/physics.ts` - **NOVO**: Módulo completo de cálculo físico
3. `src/utils/generator.ts` - Integrar cálculo híbrido e formato de tabela
4. `src/utils/ai-engine.ts` - Usar física quando disponível
5. `src/pages/GenerateReport.tsx` - Adicionar campos físicos e melhorar UX
6. `src/pages/NewReport.tsx` - Adicionar campos físicos
7. `src/utils/validation.ts` - Validações para campos físicos
8. `src/utils/export.ts` - Incluir dados do cálculo físico na exportação