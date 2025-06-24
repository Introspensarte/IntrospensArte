export function calculateTraces(type: string, wordCount: number, responses?: number): number {
  if (!type || wordCount <= 0) return 0;

  let baseTraces = 0;
  let bonusTraces = 0;

  switch (type) {
    case "narrativa":
      // Base: 300 trazos, +100 cada 500 palabras adicionales
      baseTraces = 300;
      if (wordCount > 500) {
        const extraBlocks = Math.floor((wordCount - 500) / 500);
        baseTraces += extraBlocks * 100;
      }
      break;
    case "microcuento":
      // ≤100 palabras = 100 trazos
      baseTraces = wordCount <= 100 ? 100 : 0;
      break;
    case "drabble":
      // 140-160 palabras = 150 trazos
      baseTraces = (wordCount >= 140 && wordCount <= 160) ? 150 : 0;
      break;
    case "hilo":
      // Base: 100 trazos, +50 cada 5 respuestas extra
      baseTraces = 100;
      if (responses && responses > 0) {
        const extraGroups = Math.floor(responses / 5);
        bonusTraces = extraGroups * 50;
      }
      break;
    case "rol":
      // Base: 250 trazos, +150 cada 5 respuestas extra
      baseTraces = 250;
      if (responses && responses > 0) {
        const extraGroups = Math.floor(responses / 5);
        bonusTraces = extraGroups * 150;
      }
      break;
    case "otro":
      // Encuesta: 100, Collage: 150, Poemas: 150, Pinturas: 200, Interpretación: 200
      // Por simplicidad, usamos 150 como promedio
      baseTraces = 150;
      break;
    default:
      baseTraces = 0;
  }

  return baseTraces + bonusTraces;
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