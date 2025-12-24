import { Component, OnInit, OnDestroy, Input, inject, signal, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { StructuresFacade } from '../../../core/services/structures.facade';
import { SpacesFacade } from '../../../core/services/spaces.facade';
import { FeaturesFacade } from '../../../core/services/features.facade';
import { Structure, Space, SPACE_TYPE_LABELS } from '../../../core/models';
import {
  PageHeaderComponent,
  LoadingStateComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ConfirmDialogComponent
} from '../../../shared/components';
import * as L from 'leaflet';

@Component({
    selector: 'app-structure-detail',
    imports: [
        CommonModule,
        RouterLink,
        LucideAngularModule,
        PageHeaderComponent,
        LoadingStateComponent,
        EmptyStateComponent,
        ErrorStateComponent,
        ConfirmDialogComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './structure-detail.component.html',
    styleUrl: './structure-detail.component.scss'
})
export class StructureDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() id!: string;
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  readonly structuresFacade = inject(StructuresFacade);
  readonly spacesFacade = inject(SpacesFacade);
  readonly featuresFacade = inject(FeaturesFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  structure = signal<Structure | null>(null);
  spaces = signal<Space[]>([]);

  showDeleteDialog = false;
  spaceToDelete: Space | null = null;

  private map: L.Map | null = null;

  ngOnInit(): void {
    // Subscribe to route params and queryParams
    // queryParams change triggers reload even with same ID
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.loadData();
      }
    });

    // Also subscribe to queryParams to trigger reload when t param changes
    this.route.queryParams.subscribe(() => {
      if (this.id) {
        this.loadData();
      }
    });
  }

  ngAfterViewInit(): void {
    // Map will be initialized when structure loads
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadData(): void {
    // Clear previous state first
    this.structure.set(null);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.structuresFacade.loadStructure(this.id);
    this.spacesFacade.loadSpacesByStructure(this.id);
    this.featuresFacade.loadFeatures();

    // Poll for structure data
    const checkStructure = setInterval(() => {
      const selected = this.structuresFacade.selectedStructure();
      if (selected && selected.id === this.id) {
        this.structure.set(selected);
        clearInterval(checkStructure);
        this.initMapWithRetry(10);
      }
    }, 100);

    // Poll for spaces data
    const checkSpaces = setInterval(() => {
      const filteredSpaces = this.spacesFacade.filteredSpaces();
      this.spaces.set(filteredSpaces);
      if (!this.spacesFacade.loading()) {
        clearInterval(checkSpaces);
      }
    }, 100);
  }

  private initMapWithRetry(retriesLeft: number): void {
    if (retriesLeft <= 0) return;

    requestAnimationFrame(() => {
      if (this.mapContainer?.nativeElement && this.structure()) {
        this.initMap();
      } else {
        // Container not ready, retry after a short delay
        setTimeout(() => this.initMapWithRetry(retriesLeft - 1), 50);
      }
    });
  }

  private initMap(): void {
    const s = this.structure();
    if (!s || !this.mapContainer?.nativeElement) return;

    // Remove existing map if any
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile
    }).setView(
      [s.coordinates.lat, s.coordinates.lng],
      15
    );

    // Enable scroll zoom only when map is focused/clicked
    this.map.on('click', () => {
      this.map?.scrollWheelZoom.enable();
    });

    // Disable scroll zoom when mouse leaves
    this.map.on('mouseout', () => {
      this.map?.scrollWheelZoom.disable();
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([s.coordinates.lat, s.coordinates.lng])
      .addTo(this.map)
      .bindPopup(s.name);

    // Force map to recalculate size after render
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  getSpaceTypeLabel(type: string): string {
    return SPACE_TYPE_LABELS[type as keyof typeof SPACE_TYPE_LABELS] || type;
  }

  getSpaceFeatures(space: Space) {
    return this.featuresFacade.getFeaturesByIds(space.featureIds);
  }

  editSpace(space: Space): void {
    this.router.navigate(['/structures', this.id, 'spaces', space.id, 'edit']);
  }

  confirmDeleteSpace(space: Space): void {
    this.spaceToDelete = space;
    this.showDeleteDialog = true;
  }

  onDeleteSpaceConfirm(): void {
    if (this.spaceToDelete) {
      this.spacesFacade.deleteSpace(this.spaceToDelete.id).subscribe(() => {
        this.spaces.update(list => list.filter(s => s.id !== this.spaceToDelete?.id));
      });
    }
    this.onDeleteSpaceCancel();
  }

  onDeleteSpaceCancel(): void {
    this.showDeleteDialog = false;
    this.spaceToDelete = null;
  }
}
