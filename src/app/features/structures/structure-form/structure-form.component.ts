import { Component, OnInit, OnDestroy, Input, inject, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { StructuresFacade } from '../../../core/services/structures.facade';
import { CreateStructureDto } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components';
import * as L from 'leaflet';

@Component({
    selector: 'app-structure-form',
    imports: [CommonModule, RouterLink, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
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

  form!: FormGroup;
  isSubmitting = false;
  showDeleteDialog = false;

  addressSuggestions = signal<any[]>([]);
  highlightedIndex = signal<number>(-1);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private searchTimeout: any = null;

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
    if (this.map) {
      this.map.remove();
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
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
    this.map.on('focus', () => {
      this.map?.scrollWheelZoom.enable();
    });

    // Disable scroll zoom when mouse leaves
    this.map.on('mouseout', () => {
      this.map?.scrollWheelZoom.disable();
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Click on map to set coordinates
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.map?.scrollWheelZoom.enable();
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
      const structure = this.facade.selectedStructure();
      if (structure && structure.id === this.id) {
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
        }, 200);
      }
    }, 100);
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

    this.isSubmitting = true;
    const data: CreateStructureDto = this.form.value;

    const action$ = this.isEditMode
      ? this.facade.updateStructure(this.id!, data)
      : this.facade.createStructure(data);

    action$.subscribe({
      next: (result) => {
        const targetId = this.isEditMode ? this.id! : result.id;
        // Navigate with a query param to force reload
        this.router.navigate(['/structures', targetId], {
          queryParams: { t: Date.now() }
        });
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
