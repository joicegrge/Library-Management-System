import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ToastMessage } from './models';

@Component({
  selector: 'app-root', standalone: true, imports: [NgClass, NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell" [class.sidebar-open]="mobileNav()">
      <aside class="sidebar">
        <a class="brand" routerLink="/" (click)="mobileNav.set(false)"><span class="brand-mark"><svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5.5 6.5c3.8-.7 6.7.1 8.5 2.4v14c-1.8-2.3-4.7-3.1-8.5-2.4V6.5Z"/><path d="M22.5 6.5c-3.8-.7-6.7.1-8.5 2.4v14c1.8-2.3 4.7-3.1 8.5-2.4V6.5Z"/><path d="M8.5 10.2c2.1-.1 3.7.4 5.5 1.8m-5.5 2c2.1-.1 3.7.4 5.5 1.8m5.5-5.6c-2.1-.1-3.7.4-5.5 1.8m5.5 2c-2.1-.1-3.7.4-5.5 1.8"/></svg></span><span class="brand-name">Joice<span>.</span><small>COMMUNITY LIBRARY</small></span></a>
        <div class="workspace-switch"><span class="workspace-icon">J</span><span class="workspace-copy"><b>Joice Library</b><small>Workspace</small></span><span class="chevron">⌄</span></div>
        <div class="nav-label">LIBRARY</div>
        <nav class="main-nav" aria-label="Main navigation">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="mobileNav.set(false)"><span class="nav-icon"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg></span>Overview</a>
          <a routerLink="/books" routerLinkActive="active" (click)="mobileNav.set(false)"><span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8m-8 4h6"/></svg></span>Books</a>
          <a routerLink="/members" routerLinkActive="active" (click)="mobileNav.set(false)"><span class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20v-1.7a5.5 5.5 0 0 1 11 0V20m3-9.5a3.1 3.1 0 0 0 0-6m1.3 10.6a4.8 4.8 0 0 1 1.7 3.7V20"/></svg></span>Members</a>
          <a routerLink="/loans" routerLinkActive="active" (click)="mobileNav.set(false)"><span class="nav-icon"><svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M8 3.5v4m8-4v4M4 10h16m-11 4h6m-6 3h3"/></svg></span>Loans<span class="nav-count alert" *ngIf="overdueCount()">{{ overdueCount() }}</span></a>
        </nav>
        <div class="sidebar-rule"></div>
        <div class="nav-label">YOUR SPACE</div>
        <nav class="main-nav secondary-nav"><a routerLink="/books" [queryParams]="{ category: 'Fiction' }"><span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M12 3.5 14.4 9l6 .5-4.5 3.9 1.4 5.8-5.3-3.1-5.3 3.1 1.4-5.8L3.6 9.5 9.6 9 12 3.5Z"/></svg></span>Reading list</a><a routerLink="/members"><span class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 1.8"/></svg></span>Recent activity</a></nav>
        <div class="sidebar-bottom"><div class="help-card"><div class="help-spark">✳</div><b>A little help?</b><p>Good things are best shared. Invite someone to join your library.</p><button type="button" (click)="invite()">Invite a member <span>↗</span></button></div><div class="profile"><span class="profile-avatar">JS</span><span class="profile-info"><b>Jordan Smith</b><small>Library admin</small></span><button type="button" aria-label="Profile options" class="profile-menu">···</button></div></div>
      </aside>
      <div class="sidebar-shade" (click)="mobileNav.set(false)"></div>
      <div class="main-area"><header class="topbar"><button type="button" class="mobile-toggle" aria-label="Open navigation" (click)="mobileNav.update(v => !v)"><span></span><span></span><span></span></button><div class="breadcrumbs"><span>Joice Library</span><span class="crumb-slash">/</span><b>{{ pageLabel() }}</b></div><div class="top-actions"><span class="today-label"><span class="today-dot"></span> Your library, looking lovely</span><button type="button" class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="darkMode() ? 'Switch to light mode' : 'Switch to dark mode'" [attr.title]="darkMode() ? 'Switch to light mode' : 'Switch to dark mode'"><svg *ngIf="!darkMode()" viewBox="0 0 24 24"><path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8a8.5 8.5 0 1 0 11.3 11.3Z"/></svg><svg *ngIf="darkMode()" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg><span>{{ darkMode() ? 'Light' : 'Dark' }}</span></button><button type="button" class="notification" aria-label="Notifications" (click)="goLoans()"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4"/></svg><i *ngIf="overdueCount()"></i></button><span class="top-avatar">JS</span></div></header><main class="page-content"><router-outlet></router-outlet></main><footer class="app-footer"><span>Made with care for the love of reading</span><span>Joice Library <i>·</i> A calmer way to keep a library</span></footer></div>
      <div class="toast-stack" aria-live="polite" aria-atomic="false"><div class="toast" *ngFor="let toast of toasts()" [ngClass]="toast.kind"><span class="toast-mark">{{ toast.kind === 'error' ? '!' : toast.kind === 'success' ? '✓' : 'i' }}</span>{{ toast.message }}<button type="button" aria-label="Dismiss notification" (click)="dismissToast(toast.id)">×</button></div></div>
    </div>`
})
export class AppComponent implements OnInit, OnDestroy {
  readonly mobileNav = signal(false);
  readonly darkMode = signal(false);
  readonly toasts = signal<ToastMessage[]>([]);
  readonly overdueCount = signal(0); readonly pageLabel = signal('Overview');
  private toastId = 0; private toastListener?: (event: Event) => void; private routeSub?: Subscription; private stateTimer?: number;
  constructor(private readonly router: Router) {}
  ngOnInit(): void {
    this.darkMode.set(localStorage.getItem('folio-theme') === 'dark');
    this.applyTheme();
    this.routeSub = this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => this.updatePageLabel());
    this.updatePageLabel();
    this.toastListener = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; kind: ToastMessage['kind'] }>).detail;
      const id = ++this.toastId; this.toasts.update((items) => [...items, { ...detail, id }]);
      window.setTimeout(() => this.dismissToast(id), 4000);
    };
    window.addEventListener('folio-toast', this.toastListener);
    this.refreshCounters(); this.stateTimer = window.setInterval(() => this.refreshCounters(), 250);
  }
  ngOnDestroy(): void { this.routeSub?.unsubscribe(); if (this.toastListener) window.removeEventListener('folio-toast', this.toastListener); if (this.stateTimer) window.clearInterval(this.stateTimer); }
  refreshCounters(): void {
    try { const state = JSON.parse(localStorage.getItem('folio-library-v1') ?? '{"loans":[]}') as { loans: { dueDate: string; returnDate: string | null }[] }; this.overdueCount.set(state.loans.filter((loan) => !loan.returnDate && loan.dueDate < new Date().toISOString().slice(0, 10)).length); } catch { this.overdueCount.set(0); }
  }
  updatePageLabel(): void { const path = this.router.url.split('?')[0]; this.pageLabel.set(path === '/' ? 'Overview' : path.startsWith('/books/') ? 'Book details' : path.startsWith('/members/') ? 'Member details' : path === '/books' ? 'Books' : path === '/members' ? 'Members' : 'Loans'); this.mobileNav.set(false); }
  dismissToast(id: number): void { this.toasts.update((items) => items.filter((item) => item.id !== id)); }
  toggleTheme(): void { this.darkMode.update((value) => !value); localStorage.setItem('folio-theme', this.darkMode() ? 'dark' : 'light'); this.applyTheme(); }
  private applyTheme(): void { document.documentElement.dataset['theme'] = this.darkMode() ? 'dark' : 'light'; }
  invite(): void { this.router.navigate(['/members']); window.dispatchEvent(new CustomEvent('folio-toast', { detail: { message: 'Add someone to your library from the Members page.', kind: 'info' } })); }
  goLoans(): void { this.router.navigate(['/loans']); }
}
