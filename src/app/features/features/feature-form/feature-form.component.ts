import { Component, OnInit, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { FeaturesFacade } from '../../../core/services/features.facade';
import { CreateFeatureDto, FeatureCategory, FEATURE_CATEGORY_LABELS } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components';

@Component({
  selector: 'app-feature-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feature-form.component.html',
  styleUrl: './feature-form.component.scss'
})
export class FeatureFormComponent implements OnInit {
  @Input() id?: string;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly facade = inject(FeaturesFacade);
  private readonly location = inject(Location);

  form!: FormGroup;
  isSubmitting = false;
  showDeleteDialog = false;

  categories: FeatureCategory[] = ['connectivity', 'equipment', 'accessibility', 'comfort'];

  icons = [
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'presentation', label: 'Projector' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'thermometer', label: 'Climate Control' },
    { value: 'video', label: 'Video Conference' },
    { value: 'square', label: 'Whiteboard' },
    { value: 'cable', label: 'Ethernet' },
    { value: 'sun', label: 'Natural Light' }
  ];

  get isEditMode(): boolean {
    return !!this.id;
  }

  goBack(): void {
    this.location.back();
  }

  confirmDelete(): void {
    this.showDeleteDialog = true;
  }

  onDeleteCancel(): void {
    this.showDeleteDialog = false;
  }

  onDeleteConfirm(): void {
    if (this.id) {
      this.facade.deleteFeature(this.id).subscribe(() => {
        this.router.navigate(['/features']);
      });
    }
    this.showDeleteDialog = false;
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode) {
      this.loadFeature();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required],
      icon: ['', Validators.required],
      description: ['']
    });
  }

  private loadFeature(): void {
    this.facade.loadFeature(this.id!);
    const checkLoaded = setInterval(() => {
      const feature = this.facade.selectedFeature();
      if (feature && feature.id === this.id) {
        this.form.patchValue({
          name: feature.name,
          category: feature.category,
          icon: feature.icon,
          description: feature.description || ''
        });
        clearInterval(checkLoaded);
      }
    }, 100);
  }

  getCategoryLabel(category: FeatureCategory): string {
    return FEATURE_CATEGORY_LABELS[category];
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const data: CreateFeatureDto = this.form.value;

    const action$ = this.isEditMode
      ? this.facade.updateFeature(this.id!, data)
      : this.facade.createFeature(data);

    action$.subscribe({
      next: () => {
        this.router.navigate(['/features']);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
