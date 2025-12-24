import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FeaturesFacade } from '../../../core/services/features.facade';
import { Feature, FeatureCategory, FEATURE_CATEGORY_LABELS } from '../../../core/models';
import {
    PageHeaderComponent,
    SearchInputComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent
} from '../../../shared/components';

@Component({
    selector: 'app-features-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        LucideAngularModule,
        PageHeaderComponent,
        SearchInputComponent,
        LoadingStateComponent,
        EmptyStateComponent,
        ErrorStateComponent,
        ConfirmDialogComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './features-list.component.html',
    styleUrl: './features-list.component.scss'
})
export class FeaturesListComponent implements OnInit {
    readonly facade = inject(FeaturesFacade);
    readonly categoryLabels = FEATURE_CATEGORY_LABELS;
    readonly categories: FeatureCategory[] = ['connectivity', 'equipment', 'accessibility', 'comfort'];

    searchTerm = '';
    selectedCategory: FeatureCategory | null = null;
    showDeleteDialog = false;
    featureToDelete: Feature | null = null;

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.facade.loadFeatures();
    }

    onSearch(term: string): void {
        this.searchTerm = term;
        this.facade.setSearchTerm(term);
    }

    onCategoryFilter(category: FeatureCategory | null): void {
        this.selectedCategory = category;
        this.facade.setCategoryFilter(category);
    }

    getCategoryLabel(category: FeatureCategory): string {
        return FEATURE_CATEGORY_LABELS[category];
    }

    confirmDelete(feature: Feature): void {
        this.featureToDelete = feature;
        this.showDeleteDialog = true;
    }

    onDeleteConfirm(): void {
        if (this.featureToDelete) {
            this.facade.deleteFeature(this.featureToDelete.id).subscribe();
        }
        this.onDeleteCancel();
    }

    onDeleteCancel(): void {
        this.showDeleteDialog = false;
        this.featureToDelete = null;
    }
}
