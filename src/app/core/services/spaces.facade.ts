import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, of } from 'rxjs';
import { Space, CreateSpaceDto, UpdateSpaceDto } from '../models';

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
    private readonly apiUrl = 'api/spaces';

    private readonly _state = signal<SpacesState>(initialState);

    readonly spaces = computed(() => this._state().spaces);
    readonly selectedSpace = computed(() => this._state().selectedSpace);
    readonly loading = computed(() => this._state().loading);
    readonly error = computed(() => this._state().error);
    readonly isEmpty = computed(() => !this._state().loading && this._state().spaces.length === 0);

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

    loadSpace(id: string): void {
        this.updateState({ loading: true, error: null });
        this.http.get<Space>(`${this.apiUrl}/${id}`).pipe(
            tap(space => this.updateState({ selectedSpace: space, loading: false })),
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
