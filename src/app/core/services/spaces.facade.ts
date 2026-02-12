import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, of, map } from 'rxjs';
import { Space, CreateSpaceDto, UpdateSpaceDto } from '../models';
import { SpacePersistenceService, Position3D, FeaturePositionsMap } from './space-persistence.service';

export interface SpacesState {
    spaces: Space[];
    selectedSpace: Space | null;
    loading: boolean;
    error: string | null;
}

const initialState: SpacesState = {
    spaces: [],
    selectedSpace: null,
    loading: false,
    error: null
};

@Injectable({
    providedIn: 'root'
})
export class SpacesFacade {
    private readonly http = inject(HttpClient);
    private readonly persistence = inject(SpacePersistenceService);
    private readonly apiUrl = 'api/spaces';

    private readonly _state = signal<SpacesState>(initialState);

    // Reactive map of feature positions for the currently selected space
    private readonly _featurePositions = signal<FeaturePositionsMap>({});

    readonly spaces = computed(() => this._state().spaces);
    readonly selectedSpace = computed(() => this._state().selectedSpace);
    readonly loading = computed(() => this._state().loading);
    readonly error = computed(() => this._state().error);
    readonly isEmpty = computed(() => !this._state().loading && this._state().spaces.length === 0);
    readonly spaceFeaturePositions = computed(() => this._featurePositions());

    private currentStructureId = signal<string | null>(null);
    private searchTerm = signal('');

    readonly filteredSpaces = computed(() => {
        const structureId = this.currentStructureId();
        const term = this.searchTerm().toLowerCase();
        let result = this.spaces();

        if (structureId) {
            result = result.filter(s => s.structureId === structureId);
        }

        if (term) {
            result = result.filter(s =>
                s.name.toLowerCase().includes(term) ||
                s.type.toLowerCase().includes(term)
            );
        }

        return result;
    });

    loadSpaces(): void {
        this.updateState({ loading: true, error: null });
        this.http.get<Space[]>(this.apiUrl).pipe(
            tap(spaces => this.updateState({ spaces, loading: false })),
            catchError(err => {
                this.updateState({ error: 'Failed to load spaces', loading: false });
                return of([]);
            })
        ).subscribe();
    }

    loadSpacesByStructure(structureId: string): void {
        this.currentStructureId.set(structureId);
        this.updateState({ loading: true, error: null });
        this.http.get<Space[]>(this.apiUrl).pipe(
            tap(spaces => {
                const filtered = spaces.filter(s => s.structureId === structureId);
                this.updateState({ spaces, loading: false });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to load spaces', loading: false });
                return of([]);
            })
        ).subscribe();
    }

    /**
     * Load a single space and merge its 3D feature positions from localStorage.
     */
    loadSpace(id: string): void {
        this.updateState({ loading: true, error: null });
        this.http.get<Space>(`${this.apiUrl}/${id}`).pipe(
            tap(space => {
                // Merge 3D positions from localStorage
                const positions = this.persistence.getFeaturePositions(space.id);
                this._featurePositions.set(positions);
                this.updateState({ selectedSpace: space, loading: false });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to load space', loading: false });
                return of(null);
            })
        ).subscribe();
    }

    createSpace(dto: CreateSpaceDto): Observable<Space> {
        this.updateState({ loading: true, error: null });
        const space = {
            ...dto,
            featureIds: dto.featureIds || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return this.http.post<Space>(this.apiUrl, space).pipe(
            tap(created => {
                this.updateState({
                    spaces: [...this._state().spaces, created],
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to create space', loading: false });
                throw err;
            })
        );
    }

    updateSpace(id: string, dto: UpdateSpaceDto): Observable<Space> {
        this.updateState({ loading: true, error: null });
        const update = { ...dto, id, updatedAt: new Date() };
        return this.http.put<any>(`${this.apiUrl}/${id}`, update).pipe(
            map(() => update as Space),
            tap(() => {
                const spaces = this._state().spaces.map(s =>
                    s.id === id ? { ...s, ...update } : s
                );
                this.updateState({
                    spaces,
                    selectedSpace: this._state().selectedSpace?.id === id ?
                        { ...this._state().selectedSpace!, ...update } :
                        this._state().selectedSpace,
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to update space', loading: false });
                throw err;
            })
        );
    }

    deleteSpace(id: string): Observable<void> {
        this.updateState({ loading: true, error: null });
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const spaces = this._state().spaces.filter(s => s.id !== id);
                // Also clear persisted positions
                this.persistence.clearSpacePositions(id);
                this.updateState({
                    spaces,
                    selectedSpace: this._state().selectedSpace?.id === id ? null : this._state().selectedSpace,
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to delete space', loading: false });
                throw err;
            })
        );
    }

    // ── 3D Position Management ──────────────────────────────────────

    /**
     * Update a single feature's 3D position. Saves to localStorage and updates reactive state.
     */
    updateFeaturePosition(spaceId: string, featureId: string, position: Position3D): void {
        this.persistence.saveFeaturePosition(spaceId, featureId, position);
        this._featurePositions.update(current => ({
            ...current,
            [featureId]: { ...position }
        }));
    }

    /**
     * Get all feature positions for a space from localStorage.
     */
    getFeaturePositions(spaceId: string): FeaturePositionsMap {
        return this.persistence.getFeaturePositions(spaceId);
    }

    /**
     * Load feature positions into the reactive signal for a given space.
     */
    loadFeaturePositions(spaceId: string): void {
        const positions = this.persistence.getFeaturePositions(spaceId);
        this._featurePositions.set(positions);
    }

    // ── Model Persistence (IndexedDB) ────────────────────────────────

    async saveSpaceModel(spaceId: string, file: File | Blob): Promise<void> {
        return this.persistence.saveModel(spaceId, file);
    }

    async getSpaceModel(spaceId: string): Promise<Blob | null> {
        return this.persistence.getModel(spaceId);
    }

    // ── State Helpers ───────────────────────────────────────────────

    selectSpace(space: Space | null): void {
        this.updateState({ selectedSpace: space });
    }

    setCurrentStructure(structureId: string | null): void {
        this.currentStructureId.set(structureId);
    }

    setSearchTerm(term: string): void {
        this.searchTerm.set(term);
    }

    clearError(): void {
        this.updateState({ error: null });
    }

    private updateState(partial: Partial<SpacesState>): void {
        this._state.update(state => ({ ...state, ...partial }));
    }
}
