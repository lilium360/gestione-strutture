import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { StructuresFacade } from '../../../core/services/structures.facade';
import { Structure } from '../../../core/models';
import {
  PageHeaderComponent,
  SearchInputComponent,
  LoadingStateComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ConfirmDialogComponent
} from '../../../shared/components';

@Component({
    selector: 'app-structures-list',
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
    templateUrl: './structures-list.component.html',
    styleUrl: './structures-list.component.scss'
})
export class StructuresListComponent implements OnInit {
  readonly facade = inject(StructuresFacade);

  searchTerm = '';
  showDeleteDialog = false;
  structureToDelete: Structure | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.facade.loadStructures();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.facade.setSearchTerm(term);
  }

  confirmDelete(structure: Structure): void {
    this.structureToDelete = structure;
    this.showDeleteDialog = true;
  }

  onDeleteConfirm(): void {
    if (this.structureToDelete) {
      this.facade.deleteStructure(this.structureToDelete.id).subscribe();
    }
    this.onDeleteCancel();
  }

  onDeleteCancel(): void {
    this.showDeleteDialog = false;
    this.structureToDelete = null;
  }
}
