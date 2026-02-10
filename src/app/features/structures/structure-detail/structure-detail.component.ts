import { Component, OnInit, OnDestroy, Input, inject, signal, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, DestroyRef } from '@angular/core';
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
declare const L: any;

import { AuthService } from '../../../core/services/auth.service';

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
  protected readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  structure = signal<Structure | null>(null);
  spaces = signal<Space[]>([]);

  activeFloorId = signal<string | null>(null);

  showDeleteDialog = false;
  spaceToDelete: Space | null = null;

  private map: any = null;
  private currentOverlay: any = null;
  private intervals: any[] = [];
  private isDestroyed = false;

  ngOnInit(): void {
    // Subscribe to route params and queryParams
    // queryParams change triggers reload even with same ID
    this.route.params.subscribe(params => {
      if (params['id'] && !this.isDestroyed) {
        this.id = params['id'];
        this.loadData();
      }
    });

    // Also subscribe to queryParams to trigger reload when t param changes
    this.route.queryParams.subscribe(() => {
      if (this.id && !this.isDestroyed) {
        this.loadData();
      }
    });
  }

  ngAfterViewInit(): void {
    // Map will be initialized when structure loads
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.clearIntervals();

    if (this.map) {
      if (this.currentOverlay) {
        try {
          this.currentOverlay.remove();
        } catch (e) { }
        this.currentOverlay = null;
      }
      try {
        this.map.remove();
      } catch (err) {
        console.warn('[Detail] Error during map removal:', err);
      }
      this.map = null;
    }
  }

  private clearIntervals(): void {
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];
  }

  loadData(): void {
    // Clear previous state first
    this.clearIntervals();
    this.structure.set(null);

    if (this.map) {
      try {
        this.map.remove();
      } catch (e) { }
      this.map = null;
    }

    this.structuresFacade.loadStructure(this.id);
    this.spacesFacade.loadSpacesByStructure(this.id);
    this.featuresFacade.loadFeatures();

    // Poll for structure data
    const checkStructure = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(checkStructure);
        return;
      }

      const selected = this.structuresFacade.selectedStructure();
      if (selected && selected.id === this.id) {
        this.structure.set(selected);

        // Initialise active floor
        if (selected.floors && selected.floors.length > 0) {
          this.activeFloorId.set(selected.floors[0].id);
        } else if (selected.planimetryUrl) {
          this.activeFloorId.set('legacy');
        }

        clearInterval(checkStructure);
        this.initMapWithRetry(10);
      }
    }, 100);
    this.intervals.push(checkStructure);

    // Poll for spaces data
    const checkSpaces = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(checkSpaces);
        return;
      }

      const filteredSpaces = this.spacesFacade.filteredSpaces();
      this.spaces.set(filteredSpaces);
      if (!this.spacesFacade.loading()) {
        clearInterval(checkSpaces);
      }
    }, 100);
    this.intervals.push(checkSpaces);
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
    this.map!.on('click', () => {
      this.map?.scrollWheelZoom.enable();
    });

    // Disable scroll zoom when mouse leaves
    this.map!.on('mouseout', () => {
      this.map?.scrollWheelZoom.disable();
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([s.coordinates.lat, s.coordinates.lng])
      .addTo(this.map)
      .bindPopup(s.name);

    this.renderActiveFloorOverlay();

    // Force map to recalculate size after render
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private renderActiveFloorOverlay(): void {
    if (!this.map) return;
    const s = this.structure();
    if (!s) return;

    // Remove existing overlay
    if (this.currentOverlay) {
      this.currentOverlay.remove();
      this.currentOverlay = null;
    }

    let url: string | undefined;
    let corners: { lat: number, lng: number }[] | undefined;
    let opacity: number = 0.7;

    const activeId = this.activeFloorId();

    if (activeId === 'legacy') {
      url = s.planimetryUrl;
      corners = s.planimetryCorners;
      opacity = s.planimetryOpacity ?? 0.7;
    } else if (activeId) {
      const floor = s.floors?.find(f => f.id === activeId);
      if (floor) {
        url = floor.url;
        corners = floor.corners;
        opacity = floor.opacity;
      }
    }

    if (url && corners && corners.length === 4) {
      const lCorners = corners.map(c => L.latLng(c.lat, c.lng));
      this.currentOverlay = (L as any).distortableImageOverlay(url, {
        corners: lCorners,
        opacity: opacity,
        editable: false,
        actions: []
      }).addTo(this.map);

      if (this.currentOverlay?.setOpacity) {
        this.currentOverlay.setOpacity(opacity);
      }
    }
  }

  selectFloor(id: string): void {
    this.activeFloorId.set(id);
    this.renderActiveFloorOverlay();
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

