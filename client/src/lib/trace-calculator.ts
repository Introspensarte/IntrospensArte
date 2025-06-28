
// Trace calculation based on activity type and content

export function calculateTraces(type: string, wordCount: number, responses?: number, album?: string): number {
  console.log(`Calculating traces for type: ${type}, wordCount: ${wordCount}, responses: ${responses}, album: ${album}`);
  
  // Special case for "Actividad Tardía" - always 100 traces regardless of type or word count
  if (album === "actividad-tardia") {
    console.log("Actividad Tardía detected - assigning 100 traces");
    return 100;
  }
  
  let traces = 0;

  switch (type.toLowerCase()) {
    case 'microcuento':
      // 1 a 100 palabras: 100 trazos
      if (wordCount >= 1 && wordCount <= 100) {
        traces = 100;
      } else {
        // Si excede 100 palabras, se considera como drabble o narrativa
        traces = calculateTraces(wordCount <= 200 ? 'drabble' : 'narrativa', wordCount);
      }
      break;

    case 'drabble':
      // 101 a 200 palabras: 200 trazos
      if (wordCount >= 101 && wordCount <= 200) {
        traces = 200;
      } else if (wordCount <= 100) {
        traces = calculateTraces('microcuento', wordCount);
      } else {
        traces = calculateTraces('narrativa', wordCount);
      }
      break;

    case 'narrativa':
      // 201 o más palabras: base de 300 trazos (201 a 499 palabras)
      // +100 trazos por cada 500 palabras adicionales
      if (wordCount >= 201) {
        if (wordCount <= 499) {
          traces = 300; // Base para 201-499 palabras
        } else {
          // Calcular trazos adicionales por cada bloque de 500 palabras
          const additionalBlocks = Math.floor((wordCount - 500) / 500) + 1;
          traces = 300 + (additionalBlocks * 100);
        }
      } else if (wordCount <= 100) {
        traces = calculateTraces('microcuento', wordCount);
      } else {
        traces = calculateTraces('drabble', wordCount);
      }
      break;

    case 'encuesta':
      traces = 100;
      break;

    case 'collage':
      traces = 150;
      break;

    case 'poemas':
    case 'poema':
      traces = 150;
      break;

    case 'pinturas':
    case 'pintura':
      traces = 200;
      break;

    case 'interpretación':
    case 'interpretacion':
      traces = 200;
      break;

    case 'hilo':
      // Base de 100 trazos, +50 trazos por cada 5 respuestas adicionales
      traces = 100;
      if (responses && responses >= 5) {
        const additionalBlocks = Math.floor(responses / 5);
        traces += additionalBlocks * 50;
      }
      break;

    case 'rol':
      // Base de 250 trazos, +150 trazos por cada 5 respuestas adicionales
      traces = 250;
      if (responses && responses >= 5) {
        const additionalBlocks = Math.floor(responses / 5);
        traces += additionalBlocks * 150;
      }
      break;

    default:
      // Para tipos no especificados, usar el sistema anterior como fallback
      traces = Math.max(Math.floor(wordCount / 10), 10);
      break;
  }

  console.log(`Calculated ${traces} traces`);
  return traces;
}

export function calculateExpressActivityTraces(wordCount: number, deadline: Date): number {
  const baseTraces = calculateTraces('narrativa', wordCount);
  const timeBonus = Math.floor((Date.now() - deadline.getTime()) / (1000 * 60 * 60 * 24)) * 10;
  return Math.max(baseTraces + timeBonus, baseTraces);
}
