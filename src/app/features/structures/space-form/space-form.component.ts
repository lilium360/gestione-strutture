import { Component, OnInit, Input, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SpacesFacade } from '../../../core/services/spaces.facade';
import { FeaturesFacade } from '../../../core/services/features.facade';
import { StructuresFacade } from '../../../core/services/structures.facade';
import { CreateSpaceDto, SpaceType, SPACE_TYPE_LABELS, Feature, CreateFeatureDto, FeatureCategory, FEATURE_CATEGORY_LABELS } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components';

@Component({
  selector: 'app-space-form',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './space-form.component.html',
  styleUrl: './space-form.component.scss'
})
export class SpaceFormComponent implements OnInit {
  @Input() structureId!: string;
  @Input() spaceId?: string;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly spacesFacade = inject(SpacesFacade);
  private readonly featuresFacade = inject(FeaturesFacade);
  private readonly structuresFacade = inject(StructuresFacade);
  private readonly location = inject(Location);

  form!: FormGroup;
  featureForm!: FormGroup;
  isSubmitting = false;
  showDeleteDialog = false;
  selectedFeatureIds: string[] = [];

  structureName = signal<string>('');
  allFeatures = signal<Feature[]>([]);
  showAddFeaturePanel = signal(false);
  isClosingPanel = signal(false);
  isCreatingFeature = signal(false);

  spaceTypes: SpaceType[] = ['meeting_room', 'office', 'bathroom', 'common_area', 'storage', 'kitchen'];
  featureCategories: FeatureCategory[] = ['connectivity', 'equipment', 'accessibility', 'comfort'];
  featureIcons = [
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
    return !!this.spaceId;
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
    if (this.spaceId) {
      this.spacesFacade.deleteSpace(this.spaceId).subscribe(() => {
        this.router.navigate(['/structures', this.structureId]);
      });
    }
    this.showDeleteDialog = false;
  }

  // Feature panel methods
  openAddFeaturePanel(): void {
    this.initFeatureForm();
    this.showAddFeaturePanel.set(true);
  }

  closeAddFeaturePanel(): void {
    if (this.isClosingPanel()) return;
    this.isClosingPanel.set(true);
    setTimeout(() => {
      this.showAddFeaturePanel.set(false);
      this.isClosingPanel.set(false);
    }, 200);
  }

  getFeatureCategoryLabel(category: FeatureCategory): string {
    return FEATURE_CATEGORY_LABELS[category];
  }

  isFeatureFieldInvalid(field: string): boolean {
    const control = this.featureForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onCreateFeature(): void {
    if (this.featureForm.invalid) {
      this.featureForm.markAllAsTouched();
      return;
    }

    this.isCreatingFeature.set(true);
    const data: CreateFeatureDto = this.featureForm.value;

    this.featuresFacade.createFeature(data).subscribe({
      next: (newFeature) => {
        // Add to local features list
        this.allFeatures.update(features => [...features, newFeature]);
        // Auto-select the new feature
        this.selectedFeatureIds.push(newFeature.id);
        // Close panel and reset
        this.isCreatingFeature.set(false);
        this.closeAddFeaturePanel();
      },
      error: () => {
        this.isCreatingFeature.set(false);
      }
    });
  }

  private initFeatureForm(): void {
    this.featureForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required],
      icon: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.initFeatureForm();
    this.loadData();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['', Validators.required],
      floor: [null],
      capacity: [null, [Validators.min(1)]]
    });
  }

  private loadData(): void {
    this.structuresFacade.loadStructure(this.structureId);
    this.featuresFacade.loadFeatures();

    const checkStructure = setInterval(() => {
      const structure = this.structuresFacade.selectedStructure();
      if (structure && structure.id === this.structureId) {
        this.structureName.set(structure.name);
        clearInterval(checkStructure);
      }
    }, 100);

    const checkFeatures = setInterval(() => {
      const features = this.featuresFacade.features();
      if (features.length > 0 || !this.featuresFacade.loading()) {
        this.allFeatures.set(features);
        clearInterval(checkFeatures);
      }
    }, 100);

    if (this.isEditMode) {
      this.loadSpace();
    }
  }

  private loadSpace(): void {
    this.spacesFacade.loadSpace(this.spaceId!);
    const checkLoaded = setInterval(() => {
      const space = this.spacesFacade.selectedSpace();
      if (space && space.id === this.spaceId) {
        this.form.patchValue({
          name: space.name,
          type: space.type,
          floor: space.floor,
          capacity: space.capacity
        });
        this.selectedFeatureIds = [...space.featureIds];
        clearInterval(checkLoaded);
      }
    }, 100);
  }

  getTypeLabel(type: SpaceType): string {
    return SPACE_TYPE_LABELS[type];
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  isFeatureSelected(featureId: string): boolean {
    return this.selectedFeatureIds.includes(featureId);
  }

  toggleFeature(featureId: string): void {
    const index = this.selectedFeatureIds.indexOf(featureId);
    if (index > -1) {
      this.selectedFeatureIds.splice(index, 1);
    } else {
      this.selectedFeatureIds.push(featureId);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.value;

    const data: CreateSpaceDto = {
      name: formValue.name,
      type: formValue.type,
      structureId: this.structureId,
      floor: formValue.floor,
      capacity: formValue.capacity,
      featureIds: this.selectedFeatureIds
    };

    const action$ = this.isEditMode
      ? this.spacesFacade.updateSpace(this.spaceId!, data)
      : this.spacesFacade.createSpace(data);

    action$.subscribe({
      next: () => {
        this.router.navigate(['/structures', this.structureId]);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
