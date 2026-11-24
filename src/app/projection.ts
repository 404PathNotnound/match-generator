/** Les noms de la sélection restent complets ; seule la présentation est abrégée. */
export function boardNameParts(name: string) {
  const [firstName = '', familyName] = name.trim().split(/\s+/);
  const lastHyphen = firstName.lastIndexOf('-');
  const prefix = firstName.slice(0, lastHyphen + 1);
  const ending = firstName.slice(lastHyphen + 1);

  let initial = '';
  if (familyName) {
    initial = Array.from(familyName)[0].toLocaleUpperCase('fr');
  }

  // La fin du prénom et l'initiale restent sur la même ligne.
  // Un prénom composé peut encore se couper à son tiret.
  return { prefix, ending, initial };
}

export function boardName(name: string): string {
  const { prefix, ending, initial } = boardNameParts(name);
  const firstName = prefix + ending;
  if (!initial) {
    return firstName;
  }
  return `${firstName} ${initial}.`;
}

export function projectionLayout(count: number, width: number, height: number) {
  let columns = 1;
  let bestScore = Infinity;
  for (let candidate = 1; candidate <= Math.max(1, count); candidate++) {
    if (count === 4 && candidate !== 2) {
      continue;
    }
    const rows = Math.ceil(count / candidate) || 1;
    const cardWidth = Math.max(1, width) / candidate;
    const cardHeight = Math.max(1, height) / rows;
    const cardRatio = cardWidth / cardHeight;
    const emptySlots = candidate * rows - count;
    const shapePenalty = Math.abs(Math.log(cardRatio / 1.8));
    const emptySlotsPenalty = (emptySlots / Math.max(1, count)) * 0.15;
    const score = shapePenalty + emptySlotsPenalty;
    if (score < bestScore) {
      bestScore = score;
      columns = candidate;
    }
  }
  const rows = Math.ceil(count / columns) || 1;
  const lastRowCount = count % columns || columns;
  // Un nombre de pistes commun permet de remplir aussi la dernière ligne incomplète.
  const tracks = columns * lastRowCount;
  return {
    columns,
    rows,
    tracks,
    span: lastRowCount,
    lastSpan: columns,
    lastRowStart: (rows - 1) * columns,
  };
}
