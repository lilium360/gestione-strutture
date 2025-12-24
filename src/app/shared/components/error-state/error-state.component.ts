import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-error-state',
    imports: [CommonModule, LucideAngularModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './error-state.component.html',
    styleUrl: './error-state.component.scss'
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message?: string;
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
