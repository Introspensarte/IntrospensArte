
export function calculateTraces(type: string, wordCount: number, responses?: number): number {
  let baseTraces = 0;
  let actualType = type.toLowerCase();

  // Auto-asignación de tipos basada en conteo de palabras
  if (wordCount > 0) {
    if (wordCount >= 140 && wordCount <= 160) {
      actualType = 'drabble';
    } else if (wordCount < 100 && (actualType === 'narrativa' || actualType === 'microcuento')) {
      actualType = 'microcuento';
    } else if (wordCount >= 300 && actualType !== 'hilo' && actualType !== 'rol') {
      actualType = 'narrativa';
    }
  }

  const responseCount = responses || 0;

  switch (actualType) {
    case 'narrativa':
      // Sistema escalable: cada 500 palabras da +100 trazos
      if (wordCount >= 300) {
        baseTraces = 300; // Base para las primeras 500 palabras
        if (wordCount > 500) {
          const extraBlocks = Math.floor((wordCount - 500) / 500);
          baseTraces += extraBlocks * 100;
        }
      } else if (wordCount >= 200) {
        // Narrativas cortas pero válidas
        baseTraces = 200;
      }
      break;
    
    case 'microcuento':
      if (wordCount <= 100) {
        baseTraces = 100;
      } else if (wordCount <= 150) {
        baseTraces = 80; // Penalización por exceder límite pero aún válido
      }
      break;
    
    case 'drabble':
      if (wordCount >= 140 && wordCount <= 160) {
        baseTraces = 150;
      } else if (wordCount >= 120 && wordCount <= 180) {
        baseTraces = 120; // Cercano al drabble perfecto
      } else if (wordCount < 200) {
        baseTraces = 100; // Drabble imperfecto pero válido
      }
      break;
    
    case 'hilo':
      // Sistema escalable para hilos: puntaje base 100, +50 cada 5 respuestas
      baseTraces = 100;
      if (responseCount > 5) {
        const extraLevels = Math.floor((responseCount - 5) / 5);
        baseTraces += extraLevels * 50;
      }
      break;
    
    case 'rol':
      // Sistema escalable para roles: puntaje base 250, +150 cada 5 respuestas
      baseTraces = 250;
      if (responseCount > 5) {
        const extraLevels = Math.floor((responseCount - 5) / 5);
        baseTraces += extraLevels * 150;
      }
      break;
    
    case 'encuesta':
      baseTraces = 100;
      break;
    
    case 'collage':
      baseTraces = 150;
      break;
    
    case 'poemas':
      baseTraces = 150;
      break;
    
    case 'pinturas':
      baseTraces = 200;
      break;
    
    case 'interpretacion':
      baseTraces = 200;
      break;
    
    case 'otro':
    default:
      // Dar al menos algunos trazos por el esfuerzo
      if (wordCount > 0) {
        baseTraces = Math.max(50, Math.floor(wordCount / 10));
      }
      break;
  }

  return Math.max(baseTraces, 0);
}

export function calculateBonusTraces(bonusType: string): number {
  switch (bonusType.toLowerCase()) {
    case "cumpleaños":
      return 100;
    case "ingreso-proyecto":
      return 100;
    case "promo":
      return 50;
    case "primer-mes":
      return 50;
    case "fin-bimestre":
      return 100;
    case "express-prom-1":
      return 200;
    case "express-prom-2":
      return 150;
    case "express-prom-3":
      return 100;
    case "express-prom-4":
      return 75;
    case "express-prom-5":
      return 50;
    default:
      return 0;
  }
}

export function calculateExpressActivityTraces(album: string): number {
  switch (album.toLowerCase()) {
    case "prom-1":
      return 200;
    case "prom-2":
      return 150;
    case "prom-3":
      return 100;
    case "prom-4":
      return 75;
    case "prom-5":
      return 50;
    default:
      return 0;
  }
}

// Función para obtener el tipo sugerido basado en palabras
export function getSuggestedType(wordCount: number): string {
  if (wordCount >= 140 && wordCount <= 160) {
    return 'drabble';
  } else if (wordCount <= 100) {
    return 'microcuento';
  } else if (wordCount >= 300) {
    return 'narrativa';
  }
  return 'otro';
}
