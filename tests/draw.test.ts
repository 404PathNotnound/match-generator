import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDraw, participationPlan } from '../src/app/draw.ts';
const players = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: String(i), name: `Joueur ${i}` }));
for (const count of [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 14, 15, 32, 40, 60, 61, 62, 63, 100]) {
  test(`${count} joueurs : capacité, duos et absence de doublons`, () => {
    const source = players(count);
    const original = structuredClone(source);
    const result = createDraw(source);
    assert.equal(result.matches.length, Math.floor(count / 4) + (count % 4 >= 2 ? 1 : 0));
    assert.equal(result.waiting.length, count % 2);
    assert.equal(
      result.matches.filter((match) => match.format === 'doubles').length,
      Math.floor(count / 4),
    );
    assert.equal(
      result.matches.filter((match) => match.format === 'singles').length,
      count % 4 >= 2 ? 1 : 0,
    );
    assert.deepEqual(participationPlan(count), {
      doubles: Math.floor(count / 4),
      singles: count % 4 >= 2 ? 1 : 0,
      boards: result.matches.length,
      waiting: result.waiting.length,
    });
    for (const [i, match] of result.matches.entries()) {
      assert.equal(match.board, i + 1);
      assert.deepEqual(
        match.teams.map((team) => team.length),
        match.format === 'singles' ? [1, 1] : [2, 2],
      );
    }
    const all = [...result.matches.flatMap((match) => match.teams.flat()), ...result.waiting];
    assert.equal(new Set(all.map((p) => p.id)).size, count);
    assert.deepEqual(all.map((p) => p.id).sort(), source.map((p) => p.id).sort());
    assert.deepEqual(source, original);
  });
}
test('Le mélange dépend du hasard et les résultats sont des instantanés', () => {
  const source = players(12);
  const a = createDraw(source, () => 0);
  const b = createDraw(source, () => 0.999);
  assert.notDeepEqual(a, b);
  source[0].name = 'Modifié';
  assert.equal(b.matches[0].teams[0][0].name, 'Joueur 0');
});
test('Deux adhérents homonymes restent distincts', () => {
  const source = players(4).map((p) => ({ ...p, name: 'Camille' }));
  assert.equal(createDraw(source).matches.length, 1);
});
test('Un identifiant sélectionné deux fois est refusé', () => {
  assert.throws(() => createDraw([players(1)[0], players(1)[0]]));
});

test('Six et sept joueurs donnent un double et un simple', () => {
  for (const count of [6, 7]) {
    const result = createDraw(players(count), () => 0.999);
    assert.deepEqual(
      result.matches.map((match) => match.teams.map((team) => team.map((player) => player.id))),
      [
        [
          ['0', '1'],
          ['2', '3'],
        ],
        [['4'], ['5']],
      ],
    );
    assert.deepEqual(
      result.waiting.map((player) => player.id),
      count === 7 ? ['6'] : [],
    );
  }
});
