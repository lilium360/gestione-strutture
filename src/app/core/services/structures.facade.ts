import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, tap, finalize, of, map } from 'rxjs';
import { Structure, CreateStructureDto, UpdateStructureDto } from '../models';

export interface StructuresState {
    structures: Structure[];
    selectedStructure: Structure | null;
    loading: boolean;
    error: string | null;
}

const initialState: StructuresState = {
    structures: [],
    selectedStructure: null,
    loading: false,
    error: null
};

@Injectable({
    providedIn: 'root'
})
export class StructuresFacade {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'api/structures';

    private readonly _state = signal<StructuresState>(initialState);

    readonly structures = computed(() => this._state().structures);
    readonly selectedStructure = computed(() => this._state().selectedStructure);
    readonly loading = computed(() => this._state().loading);
    readonly error = computed(() => this._state().error);
    readonly isEmpty = computed(() => !this._state().loading && this._state().structures.length === 0);

    private searchTerm = signal('');
    readonly filteredStructures = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.structures();
        return this.structures().filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.city.toLowerCase().includes(term) ||
            s.address.toLowerCase().includes(term)
        );
    });

    loadStructures(): void {
        this.updateState({ loading: true, error: null });
        this.http.get<Structure[]>(this.apiUrl).pipe(
            tap(structures => this.updateState({ structures, loading: false })),
            catchError(err => {
                this.updateState({ error: 'Failed to load structures', loading: false });
                return of([]);
            })
        ).subscribe();
    }

    loadStructure(id: string): void {
        this.updateState({ loading: true, error: null });
        this.http.get<Structure>(`${this.apiUrl}/${id}`).pipe(
            tap(structure => this.updateState({ selectedStructure: structure, loading: false })),
            catchError(err => {
                this.updateState({ error: 'Failed to load structure', loading: false });
                return of(null);
            })
        ).subscribe();
    }

    createStructure(dto: CreateStructureDto): Observable<Structure> {
        this.updateState({ loading: true, error: null });
        const structure = {
            ...dto,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return this.http.post<Structure>(this.apiUrl, structure).pipe(
            tap(created => {
                this.updateState({
                    structures: [...this._state().structures, created],
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to create structure', loading: false });
                throw err;
            })
        );
    }

    updateStructure(id: string, dto: UpdateStructureDto): Observable<Structure> {
        this.updateState({ loading: true, error: null });
        const update = { ...dto, id, updatedAt: new Date() };
        return this.http.put<any>(`${this.apiUrl}/${id}`, update).pipe(
            tap(() => {
                const structures = this._state().structures.map(s =>
                    s.id === id ? { ...s, ...update } : s
                );
                this.updateState({
                    structures,
                    selectedStructure: this._state().selectedStructure?.id === id ?
                        { ...this._state().selectedStructure!, ...update } :
                        this._state().selectedStructure,
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to update structure', loading: false });
                throw err;
            })
        );
    }

    deleteStructure(id: string): Observable<void> {
        this.updateState({ loading: true, error: null });
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const structures = this._state().structures.filter(s => s.id !== id);
                this.updateState({
                    structures,
                    selectedStructure: this._state().selectedStructure?.id === id ? null : this._state().selectedStructure,
                    loading: false
                });
            }),
            catchError(err => {
                this.updateState({ error: 'Failed to delete structure', loading: false });
                throw err;
            })
        );
    }

    selectStructure(structure: Structure | null): void {
        this.updateState({ selectedStructure: structure });
    }

    setSearchTerm(term: string): void {
        this.searchTerm.set(term);
    }

    clearError(): void {
        this.updateState({ error: null });
    }

    private updateState(partial: Partial<StructuresState>): void {
        this._state.update(state => ({ ...state, ...partial }));
    }
}
