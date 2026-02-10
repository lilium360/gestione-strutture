import { Component, OnInit, OnDestroy, Input, inject, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { StructuresFacade } from '../../../core/services/structures.facade';
import { CreateStructureDto, FloorPlanimetry } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components';
declare const L: any;


@Component({
  selector: 'app-structure-form',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './structure-form.component.html',
  styleUrl: './structure-form.component.scss'
})
export class StructureFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() id?: string;
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly facade = inject(StructuresFacade);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isSubmitting = false;
  showDeleteDialog = false;

  addressSuggestions = signal<any[]>([]);
  highlightedIndex = signal<number>(-1);

  private map: any = null;
  private marker: any = null;
  private planimetryOverlay: any = null;
  private searchTimeout: any = null;
  private intervals: any[] = [];
  private isDestroyed = false;

  planimetryUrl = signal<string | null>(null);
  planimetryOpacity = signal<number>(0.7);
  planimetryCorners = signal<{ lat: number; lng: number }[] | null>(null);

  // Multi-floor support
  floors = signal<FloorPlanimetry[]>([]);
  activeFloorId = signal<string | null>(null);
  copySuccess = signal<boolean>(false);

  activeFloor = computed(() => {
    const id = this.activeFloorId();
    return this.floors().find(f => f.id === id) || null;
  });


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
      this.facade.deleteStructure(this.id).subscribe(() => {
        this.router.navigate(['/structures']);
      });
    }
    this.showDeleteDialog = false;
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode) {
      this.loadStructure();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.clearIntervals();

    if (this.map) {
      // Cleanup layers explicitly to avoid plugin-related errors during map.remove()
      if (this.planimetryOverlay) {
        this.planimetryOverlay.remove();
        this.planimetryOverlay = null;
      }
      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }

      try {
        this.map.remove();
      } catch (err) {
        console.warn('[Form] Error during map removal:', err);
      }
      this.map = null;
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  private clearIntervals(): void {
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      description: [''],
      openingHours: [''],
      phone: [''],
      email: ['', [Validators.email]],
      // Hidden coordinates for map functionality
      coordinates: this.fb.group({
        lat: [null],
        lng: [null]
      })
    });
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement || this.map) return;

    // Default to Rome, Italy
    const defaultLat = 41.9028;
    const defaultLng = 12.4964;

    this.map = L.map(this.mapContainer.nativeElement, {
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile
    }).setView([defaultLat, defaultLng], 5);

    // Enable scroll zoom only when map is focused/clicked
    this.map!.on('focus', () => {
      this.map?.scrollWheelZoom.enable();
    });

    // Disable scroll zoom when mouse leaves
    this.map!.on('mouseout', () => {
      this.map?.scrollWheelZoom.disable();
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Click on map to set coordinates (only when not editing planimetry)
    this.map!.on('click', (e: any) => {
      this.map?.scrollWheelZoom.enable();
      // Don't move marker if planimetry overlay is being edited
      if (this.activeFloor()?.url && this.planimetryOverlay) return;
      this.updateMapMarker(e.latlng.lat, e.latlng.lng);
      this.form.patchValue({
        coordinates: { lat: e.latlng.lat, lng: e.latlng.lng }
      });
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

  }


  private loadStructure(): void {
    this.facade.loadStructure(this.id!);
    const checkLoaded = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(checkLoaded);
        return;
      }

      const structure = this.facade.selectedStructure();
      // Normalize comparison to be case-insensitive
      if (structure && structure.id?.toLowerCase() === this.id?.toLowerCase()) {
        this.form.patchValue({
          name: structure.name,
          address: structure.address,
          city: structure.city,
          description: structure.description || '',
          openingHours: structure.openingHours || '',
          phone: structure.phone || '',
          email: structure.email || '',
          coordinates: {
            lat: structure.coordinates.lat,
            lng: structure.coordinates.lng
          }
        });
        clearInterval(checkLoaded);

        setTimeout(() => {
          this.updateMapMarker(structure.coordinates.lat, structure.coordinates.lng);

          // Migrate legacy or load floors
          if (structure.floors && structure.floors.length > 0) {
            this.floors.set(structure.floors);
            this.activeFloorId.set(structure.floors[0].id);
            this.loadActiveFloor();
          } else if (structure.planimetryUrl) {
            // Migrate legacy single planimetry to first floor
            console.log(`[Form] Migrating legacy planimetry to Floor 0`);
            const legacyFloor: FloorPlanimetry = {
              id: crypto.randomUUID(),
              level: '0',
              name: 'Floor 0',
              url: structure.planimetryUrl,
              corners: structure.planimetryCorners || [],
              opacity: structure.planimetryOpacity ?? 0.7
            };
            this.floors.set([legacyFloor]);
            this.activeFloorId.set(legacyFloor.id);
            this.loadActiveFloor();
          } else {
            // Default: initialize Floor 0 if completely empty
            this.initDefaultFloor();
          }
          this.cdr.markForCheck();
        }, 200);

      }
    }, 100);
    this.intervals.push(checkLoaded);
  }

  private initDefaultFloor(): void {
    if (this.floors().length === 0) {
      const defaultFloor: FloorPlanimetry = {
        id: crypto.randomUUID(),
        level: '0',
        name: 'Floor 0',
        url: '',
        corners: [],
        opacity: 0.7
      };
      this.floors.set([defaultFloor]);
      this.activeFloorId.set(defaultFloor.id);
      this.loadActiveFloor();
    }
  }

  private loadActiveFloor(): void {
    const floor = this.activeFloor();
    if (floor) {
      this.planimetryUrl.set(floor.url);
      this.planimetryCorners.set(floor.corners && floor.corners.length === 4 ? floor.corners : null);
      this.planimetryOpacity.set(floor.opacity);
      this.initPlanimetryOverlay();
    } else {
      this.planimetryUrl.set(null);
      this.planimetryCorners.set(null);
      this.initPlanimetryOverlay();
    }
  }


  selectFloor(id: string): void {
    if (this.activeFloorId() === id) return;

    // 1. Save current overlay state to the currently active floor
    this.saveActiveFloorState();

    // 2. Switch
    this.activeFloorId.set(id);

    // 3. Load the new active floor
    this.loadActiveFloor();
  }

  addFloor(): void {
    const newId = crypto.randomUUID();
    const currentFloors = this.floors();
    const nextLevel = currentFloors.length.toString();

    const newFloor: FloorPlanimetry = {
      id: newId,
      level: nextLevel,
      name: `Floor ${nextLevel}`,
      url: '',
      corners: [],
      opacity: 0.7
    };

    this.saveActiveFloorState();
    this.floors.set([...currentFloors, newFloor]);
    this.activeFloorId.set(newId);
    this.loadActiveFloor();
  }

  removeFloor(id: string, event: Event): void {
    event.stopPropagation();
    const filtered = this.floors().filter(f => f.id !== id);
    this.floors.set(filtered);

    if (this.activeFloorId() === id) {
      this.activeFloorId.set(filtered.length > 0 ? filtered[0].id : null);
      this.loadActiveFloor();
    }
  }

  updateFloorName(id: string, name: string): void {
    const updated = this.floors().map(f => f.id === id ? { ...f, name } : f);
    this.floors.set(updated);
  }

  private saveActiveFloorState(): void {
    if (this.activeFloorId()) {
      // Ensure the signal state is fresh from overlay
      this.updatePlanimetryCorners();

      const updated = this.floors().map(f => {
        if (f.id === this.activeFloorId()) {
          return {
            ...f,
            url: this.planimetryUrl() || '',
            corners: this.planimetryCorners() || [],
            opacity: this.planimetryOpacity()
          };
        }
        return f;
      });
      this.floors.set(updated);
    }
  }

  onAddressInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.length < 3) {
      this.addressSuggestions.set([]);
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.searchAddress(query);
    }, 300);
  }

  onAddressKeydown(event: KeyboardEvent): void {
    const suggestions = this.addressSuggestions();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.min(this.highlightedIndex() + 1, suggestions.length - 1);
      this.highlightedIndex.set(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = Math.max(this.highlightedIndex() - 1, 0);
      this.highlightedIndex.set(prev);
    } else if (event.key === 'Enter' && this.highlightedIndex() >= 0) {
      event.preventDefault();
      this.selectSuggestion(suggestions[this.highlightedIndex()]);
    } else if (event.key === 'Escape') {
      this.addressSuggestions.set([]);
    }
  }

  private async searchAddress(query: string): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      this.addressSuggestions.set(data);
      this.highlightedIndex.set(-1);
    } catch (error) {
      console.error('Address search failed:', error);
      this.addressSuggestions.set([]);
    }
  }

  selectSuggestion(suggestion: any): void {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    // Build proper address from components
    const addr = suggestion.address;
    let streetAddress = '';

    if (addr) {
      // Try to get street name with house number
      const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';
      const houseNumber = addr.house_number || '';

      if (road && houseNumber) {
        streetAddress = `${road} ${houseNumber}`;
      } else if (road) {
        streetAddress = road;
      } else {
        // Fallback to first part of display name
        streetAddress = suggestion.display_name.split(',')[0];
      }
    } else {
      streetAddress = suggestion.display_name.split(',')[0];
    }

    // Get city from various possible fields
    const city = addr?.city || addr?.town || addr?.municipality || addr?.village || addr?.county || '';

    this.form.patchValue({
      address: streetAddress,
      city: city,
      coordinates: { lat, lng }
    });

    this.addressSuggestions.set([]);
    this.updateMapMarker(lat, lng);
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data.address) {
        this.form.patchValue({
          address: data.address.road ? `${data.address.road}${data.address.house_number ? ' ' + data.address.house_number : ''}` : data.display_name.split(',')[0],
          city: data.address.city || data.address.town || data.address.municipality || ''
        });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  }

  onCoordinatesChange(): void {
    const coords = this.form.get('coordinates')?.value;
    if (coords?.lat && coords?.lng) {
      this.updateMapMarker(coords.lat, coords.lng);
    }
  }

  private updateMapMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }

    this.map.setView([lat, lng], 15);
  }

  onPlanimetryUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;

        // 1. Update the local planimetryUrl signal (used for rendering)
        this.planimetryUrl.set(url);

        // 2. Immediately update the floors array to reflect the new URL
        const updated = this.floors().map(f =>
          f.id === this.activeFloorId() ? { ...f, url } : f
        );
        this.floors.set(updated);

        // 3. Re-initialize the overlay
        this.initPlanimetryOverlay();
      };
      reader.readAsDataURL(file);
    }
  }


  removePlanimetry(): void {
    if (this.planimetryOverlay) {
      this.planimetryOverlay.remove();
      this.planimetryOverlay = null;
    }
    this.planimetryUrl.set(null);
    this.planimetryCorners.set(null);
  }

  onOpacityChange(event: Event): void {
    const opacity = parseFloat((event.target as HTMLInputElement).value);
    this.planimetryOpacity.set(opacity);
    if (this.planimetryOverlay) {
      this.planimetryOverlay.setOpacity(opacity);
    }
  }

  private initPlanimetryOverlay(): void {
    if (!this.map || !this.planimetryUrl()) return;

    if (this.planimetryOverlay) {
      this.planimetryOverlay.remove();
    }

    const url = this.planimetryUrl()!;
    const savedCorners = this.planimetryCorners();

    if (savedCorners && savedCorners.length === 4) {
      const corners = savedCorners.map(c => L.latLng(c.lat, c.lng));
      this.planimetryOverlay = (L as any).distortableImageOverlay(url, {
        corners: corners,
        opacity: this.planimetryOpacity()
      }).addTo(this.map);
    } else {
      // Calculate initial corners around the current map center
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();
      const offset = 0.001 / Math.pow(2, zoom - 15); // Adjust size based on zoom

      const corners = [
        L.latLng(center.lat + offset, center.lng - offset),
        L.latLng(center.lat + offset, center.lng + offset),
        L.latLng(center.lat - offset, center.lng - offset),
        L.latLng(center.lat - offset, center.lng + offset)
      ];

      this.planimetryOverlay = (L as any).distortableImageOverlay(url, {
        corners: corners,
        opacity: this.planimetryOpacity()
      }).addTo(this.map);
    }

    // Explicitly set opacity again as a safeguard
    if (this.planimetryOverlay && this.planimetryOverlay.setOpacity) {
      this.planimetryOverlay.setOpacity(this.planimetryOpacity());
    }


    // Subscribe to events to update corners
    this.planimetryOverlay.on('edit', () => {
      this.updatePlanimetryCorners();
    });

    // Also update on initial load if calculated
    this.updatePlanimetryCorners();
  }

  private updatePlanimetryCorners(): void {
    if (this.planimetryOverlay) {
      const corners = this.planimetryOverlay.getCorners();
      this.planimetryCorners.set(corners.map((c: any) => ({ lat: c.lat, lng: c.lng })));

      // Also sync opacity if changed via toolbar
      const currentOpacity = this.planimetryOverlay.options.opacity;
      if (currentOpacity !== undefined && currentOpacity !== this.planimetryOpacity()) {
        this.planimetryOpacity.set(currentOpacity);
      }
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  isCoordinateInvalid(field: string): boolean {
    const control = this.form.get(`coordinates.${field}`);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saveActiveFloorState();

    this.isSubmitting = true;
    const formData = this.form.value;
    const data: CreateStructureDto = {
      ...formData,
      floors: this.floors(),
      // Keep single planimetry fields for backward compatibility/preview
      planimetryUrl: this.floors()[0]?.url || undefined,
      planimetryCorners: this.floors()[0]?.corners || undefined,
      planimetryOpacity: this.floors()[0]?.opacity || 0.7
    };


    const action$ = this.isEditMode
      ? this.facade.updateStructure(this.id!, data)
      : this.facade.createStructure(data);


    action$.subscribe({
      next: (result) => {
        const targetId = this.isEditMode ? this.id! : (result as any).id;
        console.log(`[Form] Update successful. Navigating to structure ${targetId}`);

        // Clean up overlay before navigation
        if (this.planimetryOverlay) {
          this.planimetryOverlay.remove();
          this.planimetryOverlay = null;
        }

        // Use absolute path with leading slash
        const redirectUrl = `/structures/${targetId}`;
        this.router.navigateByUrl(redirectUrl).then(
          (success) => {
            if (!success) console.error('[Form] Navigation to detail failed');
          },
          (err) => console.error('[Form] Navigation error:', err)
        );
      },
      error: (err) => {
        console.error('[Form] Submit error:', err);
        this.isSubmitting = false;

        // In edit mode, if local state was updated via tap(), we still try to navigate
        if (this.isEditMode && this.id) {
          console.warn('[Form] PUT failed but attempting redirect to latest local state');
          if (this.planimetryOverlay) {
            this.planimetryOverlay.remove();
            this.planimetryOverlay = null;
          }
          this.router.navigateByUrl(`/structures/${this.id}`);
        }
      }
    });
  }

  copyCornersJson(): void {
    const corners = this.planimetryCorners();
    if (corners) {
      navigator.clipboard.writeText(JSON.stringify(corners, null, 2)).then(() => {
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2000);
      });
    }
  }
}

