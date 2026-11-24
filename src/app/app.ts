import {
  Component,
  computed,
  effect,
  signal,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { createDraw, participationPlan, type Player, type Draw } from './draw';

import { boardName, boardNameParts, projectionLayout } from './projection';

import { FitBoardNames } from './fit-board-names.directive';

import { CLUB_MEMBERS } from './club-members';

// Sépare la liste réelle de l’ancien stockage de démonstration, conservé intact.
const STORAGE_KEY = 'match-generator.club.v2';
const NAME_ORDER = new Intl.Collator('fr', { sensitivity: 'base' });

@Component({
  selector: 'app-root',
  imports: [FormsModule, FitBoardNames],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  readonly boardName = boardName;
  readonly boardNameParts = boardNameParts;
  readonly gridSize = signal({ width: 1280, height: 720 });
  readonly projection = computed(() => {
    const matchCount = this.draw()?.matches.length ?? 0;
    const { width, height } = this.gridSize();
    return projectionLayout(matchCount, width, height);
  });
  private gridObserver?: ResizeObserver;

  @ViewChild('boardGrid')
  set boardGrid(element: ElementRef<HTMLElement> | undefined) {
    this.gridObserver?.disconnect();
    if (!element) {
      return;
    }
    this.gridObserver = new ResizeObserver(([entry]) => {
      this.gridSize.set({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    this.gridObserver.observe(element.nativeElement);
  }

  ngOnDestroy() {
    this.gridObserver?.disconnect();
  }

  readonly members = signal<Player[]>(CLUB_MEMBERS.map((player) => ({ ...player })));
  readonly selected = signal<string[]>([]);
  readonly draw = signal<Draw | null>(null);
  readonly round = signal(0);
  readonly changed = signal(false);
  readonly screenMode = signal(false);
  readonly managing = signal(false);
  readonly notice = signal('');
  readonly storageIssue = signal(false);
  search = '';
  newName = '';
  readonly query = signal('');
  readonly visibleMembers = computed(() =>
    this.members()
      .filter((p) => this.normalize(p.name).includes(this.normalize(this.query())))
      .sort((a, b) => {
        const [firstA, ...lastA] = a.name.split(' ');
        const [firstB, ...lastB] = b.name.split(' ');
        const firstNameOrder = NAME_ORDER.compare(firstA, firstB);
        if (firstNameOrder !== 0) {
          return firstNameOrder;
        }
        return NAME_ORDER.compare(lastA.join(' '), lastB.join(' '));
      }),
  );
  readonly selectedPlayers = computed(() =>
    this.members().filter((p) => this.selected().includes(p.id)),
  );
  readonly plan = computed(() => participationPlan(this.selectedPlayers().length));
  readonly boardCount = computed(() => this.plan().boards);
  readonly waitingCount = computed(() => this.plan().waiting);
  readonly hasSingles = computed(
    () => this.draw()?.matches.some((match) => match.format === 'singles') ?? false,
  );

  readonly drawSummary = computed(() => {
    const currentDraw = this.draw();
    if (!currentDraw) {
      return 'Tirage aléatoire · doubles et simple';
    }
    const boardCount = currentDraw.matches.length;
    if (this.hasSingles()) {
      return `${boardCount} planches · avec un 1 contre 1`;
    }
    return `${boardCount} planches · 2 contre 2`;
  });

  projectionSpan(index: number) {
    const layout = this.projection();
    if (index >= layout.lastRowStart) {
      return layout.lastSpan;
    }
    return layout.span;
  }

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (
          !Array.isArray(state.members) ||
          !state.members.every(
            (p: Player) =>
              typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim().length > 0,
          ) ||
          new Set(state.members.map((p: Player) => p.id)).size !== state.members.length
        ) {
          throw new Error('Invalid members');
        }
        this.members.set(state.members);
        this.selected.set(
          Array.isArray(state.selected)
            ? state.selected.filter((id: unknown) => state.members.some((p: Player) => p.id === id))
            : [],
        );
      }
    } catch {
      this.storageIssue.set(true);
    }
    effect(() => {
      const state = { members: this.members(), selected: this.selected() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        this.storageIssue.set(true);
      }
    });
  }
  private normalize(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr');
  }
  private markChanged() {
    if (this.draw()) {
      this.changed.set(true);
    }
  }
  setSelected(id: string, checked: boolean) {
    this.selected.update((ids) => {
      if (!checked) {
        return ids.filter((selectedId) => selectedId !== id);
      }
      if (ids.includes(id)) {
        return ids;
      }
      return [...ids, id];
    });
    this.markChanged();
  }
  selectAll() {
    this.selected.set(this.members().map((p) => p.id));
    this.markChanged();
  }
  clearSelection() {
    this.selected.set([]);
    this.markChanged();
  }
  generate() {
    const players = this.selectedPlayers();
    if (players.length < 2) {
      return;
    }
    const nextDraw = createDraw(players);
    this.draw.set(nextDraw);
    this.round.update((value) => value + 1);
    this.changed.set(false);
    this.notice.set(
      `Tirage ${this.round()} généré : ${nextDraw.matches.length} planches et ${nextDraw.waiting.length} joueurs en attente.`,
    );
  }
  addMember() {
    const name = this.newName.trim();
    if (!name) {
      this.notice.set('Saisis un prénom.');
      return;
    }
    if (/[,;\r\n]/.test(name)) {
      this.notice.set('Ajoute une seule personne à la fois.');
      return;
    }
    if (name.length > 60) {
      this.notice.set('Le nom doit contenir 60 caractères maximum.');
      return;
    }
    const alreadyExists = this.members().some((player) => {
      return this.normalize(player.name) === this.normalize(name);
    });
    if (alreadyExists) {
      this.notice.set(`${name} est déjà dans la liste.`);
      return;
    }
    const id = crypto.randomUUID();
    this.members.update((members) => [...members, { id, name }]);
    this.newName = '';
    this.notice.set(`${name} ajouté à la liste.`);
    this.setSelected(id, true);
  }
  removeMember(player: Player) {
    const shouldRemove = window.confirm(`Supprimer ${player.name} de la liste des membres ?`);
    if (!shouldRemove) {
      return;
    }
    this.members.update((members) => members.filter((p) => p.id !== player.id));
    this.selected.update((ids) => ids.filter((id) => id !== player.id));
    this.markChanged();
  }
  async toggleScreen() {
    if (this.screenMode()) {
      this.screenMode.set(false);
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } else {
      this.screenMode.set(true);
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  }
}
