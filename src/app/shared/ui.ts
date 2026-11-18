import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

@Component({ selector: 'app-avatar', standalone: true, imports: [NgClass], template: `<span class="avatar" [ngClass]="'tone-' + tone">{{ initials }}</span>`, styles: [`.avatar{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#edece7;color:#43483e;font-size:11px;font-weight:700;flex:none}.tone-1{background:#ecdfcf;color:#836344}.tone-2{background:#dce7dd;color:#516c55}.tone-3{background:#e5dfe9;color:#685776}.tone-4{background:#e9dddd;color:#8b5955}.tone-5{background:#dce3e7;color:#4f6974}`] })
export class AvatarComponent { @Input() initials = ''; @Input() tone = 0; }

@Component({ selector: 'app-badge', standalone: true, imports: [NgClass], template: `<span class="badge" [ngClass]="kind"><i></i><ng-content></ng-content></span>`, styles: [`.badge{display:inline-flex;align-items:center;gap:6px;width:max-content;border-radius:99px;padding:5px 9px;font-size:10px;font-weight:600;letter-spacing:.01em;white-space:nowrap;background:#f0f0ec;color:#666a60}.badge i{width:5px;height:5px;border-radius:50%;background:currentColor}.available,.returned,.standard{background:#e8efe8;color:#527358}.issued,.premium{background:#f0eade;color:#8d6a38}.overdue{background:#f7e8e6;color:#b25c4d}.student{background:#e8edf2;color:#62798d}`] })
export class BadgeComponent { @Input() kind = ''; }

@Component({ selector: 'app-modal', standalone: true, imports: [NgIf], template: `
<div class="modal-backdrop" (pointerdown)="backdropPointerDown($event)" (pointerup)="backdropPointerUp($event)" (keydown.escape)="close.emit()" tabindex="-1">
  <section class="modal-card" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId">
    <header class="modal-head"><div><h2 [id]="titleId">{{ title }}</h2><p *ngIf="subtitle">{{ subtitle }}</p></div><button class="icon-button" type="button" aria-label="Close dialog" (click)="close.emit()">×</button></header>
    <div class="modal-content"><ng-content></ng-content></div>
  </section>
</div>`, styles: [`.modal-backdrop{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:20px;background:rgba(35,39,34,.34);backdrop-filter:blur(4px);animation:fadeIn .16s ease}.modal-card{width:min(100%,540px);max-height:min(88vh,780px);overflow:auto;border-radius:13px;background:#fff;box-shadow:0 24px 80px rgba(28,31,27,.2);animation:slideUp .2s ease}.modal-head{display:flex;align-items:flex-start;justify-content:space-between;padding:25px 26px 20px;border-bottom:1px solid #efefeb}.modal-head h2{margin:0;font:700 20px 'Manrope',sans-serif;letter-spacing:-.5px}.modal-head p{margin:5px 0 0;color:#81847b;font-size:12px}.modal-content{padding:22px 26px 26px}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:.5;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`]
})
export class ModalComponent {
  @Input() title = ''; @Input() subtitle = ''; @Input() titleId = 'dialog-title';
  @Output() close = new EventEmitter<void>();
  private backdropPointerStarted = false;
  backdropPointerDown(event: PointerEvent): void { this.backdropPointerStarted = event.target === event.currentTarget; }
  backdropPointerUp(event: PointerEvent): void {
    const shouldClose = this.backdropPointerStarted && event.target === event.currentTarget;
    this.backdropPointerStarted = false;
    if (shouldClose) this.close.emit();
  }
}
