import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, of } from 'rxjs';
import { Feature, CreateFeatureDto, UpdateFeatureDto, FeatureCategory } from '../models';

export interface FeaturesState {
    features: Feature[];
    selectedFeature: Feature | null;
    loading: boolean;
    error: string | null;
}

const initialState: FeaturesState = {
    features: [],
    selectedFeature: null,
    loading: false,
    error: null
};

@Injectable({
    providedIn: 'root'
})
export class FeaturesFacade {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'api/features';

    private readonly _state = signal<FeaturesState>(initialState);

    readonly features = computed(() => this._state().features);
    readonly selectedFeature = computed(() => this._state().selectedFeature);
    readonly loading = computed(() => this._state().loading);
    readonly error = computed(() => this._state().error);
    readonly isEmpty = computed(() => !this._state().loading && this._state().features.length === 0);

    private searchTerm = signal('');
    private categoryFilter = signal<FeatureCategory | null>(null);

    readonly filteredFeatures = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const category = this.categoryFilter();
        let result = this.features();

        if (category) {
            result = result.filter(f => f.category === category);
        }

        if (term) {
            result = result.filter(f =>
                f.name.toLowerCase().includes(term) ||
                f.description?.toLowerCase().includes(term)
            );
        }

        return result;
    });

    readonly featuresByCategory = computed(() => {
        const features = this.features();
        return features.reduce((acc, feature) => {
            if (!acc[feature.category]) {
                acc[feature.category] = [];
            }
            acc[feature.category].push(feature);
            return acc;
        }, {} as Record<FeatureCategory, Feature[]>);
    });

    loadFeatures(): void {
        this.updateState({ loading: true, error: null });
        this.http.get<Feature[]>(this.apiUrl).pipe(
            tap(features => this.updateState({ features, loading: false })),
            catchError(err => {
                this.updateState({ error: 'Failed to load features', loading: false });
                return of([]);
            })
        ).subscribe();
    }

    loadFeature(id: string): void {
        this.updateState({ loading: true, error: null });
        this.http.get<Feature>(`${this.apiUrl}/${id}`).pipe(
            tap(feature => this.updateState({ selectedFeature: feature, loading: false })),
            catchError(err => {
                this.updateState({ error: 'Failed to load feature', loading: false });
                return of(null);
            })
        ).subscribe();
    }

    getFeaturesByIds(ids: string[]): Feature[] {
        return this.features().filter(f => ids.includes(f.id));
    }

    createFeature(dto: CreateFeatureDto): Observable<Feature> {
        this.updateState({ loading: true, error: null });
        return this.http.post<Feature>(this.apiUrl, dto).pipe(
            tap(created => {
                this.updateState({
                    features: [...this._state().features, created],
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to create feature', loading: false });
                throw err;
            })
        );
    }

    updateFeature(id: string, dto: UpdateFeatureDto): Observable<Feature> {
        this.updateState({ loading: true, error: null });
        const update = { ...dto, id };
        return this.http.put<any>(`${this.apiUrl}/${id}`, update).pipe(
            tap(() => {
                const features = this._state().features.map(f =>
                    f.id === id ? { ...f, ...update } : f
                );
                this.updateState({
                    features,
                    selectedFeature: this._state().selectedFeature?.id === id ?
                        { ...this._state().selectedFeature!, ...update } :
                        this._state().selectedFeature,
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to update feature', loading: false });
                throw err;
            })
        );
    }

    deleteFeature(id: string): Observable<void> {
        this.updateState({ loading: true, error: null });
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const features = this._state().features.filter(f => f.id !== id);
                this.updateState({
                    features,
                    selectedFeature: this._state().selectedFeature?.id === id ? null : this._state().selectedFeature,
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to delete feature', loading: false });
                throw err;
            })
        );
    }

    selectFeature(feature: Feature | null): void {
        this.updateState({ selectedFeature: feature });
    }

    setSearchTerm(term: string): void {
        this.searchTerm.set(term);
    }

    setCategoryFilter(category: FeatureCategory | null): void {
        this.categoryFilter.set(category);
    }

    clearError(): void {
        this.updateState({ error: null });
    }

    private updateState(partial: Partial<FeaturesState>): void {
        this._state.update(state => ({ ...state, ...partial }));
    }
}
