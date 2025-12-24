import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-state',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './loading-state.component.html',
    styleUrl: './loading-state.component.scss'
})
export class LoadingStateComponent {
  @Input() message?: string;
}
