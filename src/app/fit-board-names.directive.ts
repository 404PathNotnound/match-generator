import { AfterViewInit, Directive, ElementRef, Input, OnChanges, OnDestroy } from '@angular/core';

/** Agrandit les noms jusqu'à la limite de la carte, avec deux lignes au maximum. */
@Directive({ selector: '[appFitBoardNames]' })
export class FitBoardNames implements AfterViewInit, OnChanges, OnDestroy {
  @Input() appFitBoardNames = false;
  // Un nouveau tirage relance la mesure, même si la carte garde la même taille.
  @Input() nameFitContent: unknown;

  private observer?: ResizeObserver;
  private frame?: number;
  private destroyed = false;

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    const matchup = this.element.nativeElement.querySelector('.matchup');
    if (!matchup) {
      return;
    }

    this.observer = new ResizeObserver(() => this.scheduleFit());
    this.observer.observe(matchup);
    document.fonts.ready.then(() => this.scheduleFit());
    this.scheduleFit();
  }

  ngOnChanges() {
    this.scheduleFit();
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.observer?.disconnect();
    if (this.frame !== undefined) {
      cancelAnimationFrame(this.frame);
    }
  }

  private scheduleFit() {
    if (this.destroyed) {
      return;
    }
    if (this.frame !== undefined) {
      cancelAnimationFrame(this.frame);
    }
    this.frame = requestAnimationFrame(() => this.fitNames());
  }

  private fitNames() {
    const card = this.element.nativeElement;
    if (!this.appFitBoardNames) {
      card.style.removeProperty('--fitted-name-size');
      return;
    }

    const matchup = card.querySelector<HTMLElement>('.matchup');
    const teams = Array.from(card.querySelectorAll<HTMLElement>('.team'));
    const names = Array.from(card.querySelectorAll<HTMLElement>('.team > .player-label'));
    if (!matchup || names.length === 0) {
      return;
    }

    const style = getComputedStyle(matchup);
    const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const availableHeight = matchup.clientHeight - verticalPadding;
    if (availableHeight <= 0) {
      return;
    }

    const fits = (size: number) => {
      card.style.setProperty('--fitted-name-size', `${size}px`);
      const teamsFit = teams.every(
        (team) => team.getBoundingClientRect().height <= availableHeight,
      );
      const namesFit = names.every((name) => {
        const lineHeight = parseFloat(getComputedStyle(name).lineHeight);
        const hasAtMostTwoLines = name.getBoundingClientRect().height <= lineHeight * 2 + 0.5;
        const fitsWidth = name.scrollWidth <= name.clientWidth + 1;
        return hasAtMostTwoLines && fitsWidth;
      });
      return teamsFit && namesFit;
    };

    // Réduire l'intervalle à chaque essai évite de tester toutes les tailles une à une.
    let minimum = 1;
    let maximum = Math.floor(availableHeight);
    let bestSize = 1;
    while (minimum <= maximum) {
      const candidateSize = Math.floor((minimum + maximum) / 2);
      if (fits(candidateSize)) {
        bestSize = candidateSize;
        minimum = candidateSize + 1;
      } else {
        maximum = candidateSize - 1;
      }
    }
    card.style.setProperty('--fitted-name-size', `${bestSize}px`);
  }
}
