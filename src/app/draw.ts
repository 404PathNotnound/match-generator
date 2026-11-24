export interface Player {
  id: string;
  name: string;
}
export interface Match {
  board: number;
  format: 'doubles' | 'singles';
  teams: [Player[], Player[]];
}
export interface Draw {
  matches: Match[];
  waiting: Player[];
}

/** Les groupes de quatre jouent en double ; deux joueurs restants jouent en simple. */
export function participationPlan(count: number) {
  const doubles = Math.floor(count / 4);
  const remainingAfterDoubles = count % 4;
  let singles = 0;
  if (remainingAfterDoubles >= 2) {
    singles = 1;
  }
  return { doubles, singles, boards: doubles + singles, waiting: count % 2 };
}

/** Fisher–Yates: every permutation has the same probability. */
export function createDraw(players: readonly Player[], random: () => number = Math.random): Draw {
  if (new Set(players.map((p) => p.id)).size !== players.length) {
    throw new Error('Un joueur ne peut être sélectionné qu’une fois.');
  }
  const shuffled = players.map((player) => ({ ...player }));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const previousPlayer = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = previousPlayer;
  }
  const plan = participationPlan(shuffled.length);
  const matches: Match[] = [];
  for (let index = 0; index < plan.doubles; index++) {
    const firstPlayerIndex = index * 4;
    const firstTeam = shuffled.slice(firstPlayerIndex, firstPlayerIndex + 2);
    const secondTeam = shuffled.slice(firstPlayerIndex + 2, firstPlayerIndex + 4);
    matches.push({
      board: index + 1,
      format: 'doubles',
      teams: [firstTeam, secondTeam],
    });
  }
  const usedInDoubles = plan.doubles * 4;
  if (plan.singles) {
    matches.push({
      board: matches.length + 1,
      format: 'singles',
      teams: [[shuffled[usedInDoubles]], [shuffled[usedInDoubles + 1]]],
    });
  }
  return { matches, waiting: shuffled.slice(usedInDoubles + plan.singles * 2) };
}
