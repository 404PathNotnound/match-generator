import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardName, boardNameParts, projectionLayout } from '../src/app/projection.ts';
test('Les noms abrégés conservent les prénoms composés et les particules', () => {
  assert.equal(boardName('Robin Gilard'), 'Robin G.');
  assert.equal(boardName('Anne-Marie Jégard'), 'Anne-Marie J.');
  assert.equal(boardName('Laure Le Gaillard'), 'Laure L.');
  assert.equal(boardName(' Soen '), 'Soen');
});
test('Chaque ligne remplit la largeur, pour 1 à 25 planches et plusieurs formats', () => {
  for (const [width, height] of [
    [1920, 900],
    [1366, 600],
    [768, 900],
    [640, 300],
  ]) {
    for (let count = 1; count <= 25; count++) {
      const grid = projectionLayout(count, width, height);
      assert.ok(grid.rows * grid.columns >= count);
      if (count === 4) assert.deepEqual([grid.columns, grid.rows], [2, 2]);
      assert.equal(grid.columns * grid.span, grid.tracks);
      const lastCount = count - grid.lastRowStart;
      assert.equal(lastCount * grid.lastSpan, grid.tracks);
    }
  }
});

test('La fin du prénom reste groupée avec son initiale', () => {
  assert.deepEqual(boardNameParts('Alexandre Guilleux'), {
    prefix: '',
    ending: 'Alexandre',
    initial: 'G',
  });
  assert.deepEqual(boardNameParts('Anne-Marie Jégard'), {
    prefix: 'Anne-',
    ending: 'Marie',
    initial: 'J',
  });
  assert.deepEqual(boardNameParts('Soen'), { prefix: '', ending: 'Soen', initial: '' });
});
