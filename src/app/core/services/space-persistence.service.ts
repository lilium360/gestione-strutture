import { Injectable } from '@angular/core';

export interface Position3D {
    x: number;
    y: number;
    z: number;
}

export type FeaturePositionsMap = Record<string, Position3D>;

const DEFAULT_POSITIONS: Record<string, FeaturePositionsMap> = {
    'sp24': {
        'f2': { x: -7, y: 5, z: 0 },    // Projector
        'f5': { x: 5.7, y: 2, z: 0 },  // Video Conference
        'f8': { x: -0.6, y: 5, z: 0 } // Natural light
    }
};

/**
 * Private service for persisting 3D feature positions in localStorage.
 * This service should ONLY be used by SpacesFacade — never directly by components.
 */
@Injectable({
    providedIn: 'root'
})
export class SpacePersistenceService {

    private readonly STORAGE_PREFIX = 'space_';
    private readonly STORAGE_SUFFIX = '_features';
    private readonly DB_NAME = 'AugmentDB';
    private readonly STORE_NAME = 'models';

    /**
     * Get all feature positions for a given space.
     */
    getFeaturePositions(spaceId: string): FeaturePositionsMap {
        const key = this.buildKey(spaceId);
        const raw = localStorage.getItem(key);

        if (!raw) {
            // Check for default seeding
            return DEFAULT_POSITIONS[spaceId] || {};
        }

        try {
            return JSON.parse(raw) as FeaturePositionsMap;
        } catch {
            console.warn(`[SpacePersistence] Failed to parse positions for space ${spaceId}`);
            return DEFAULT_POSITIONS[spaceId] || {};
        }
    }

    /**
     * Save or update a single feature's 3D position within a space.
     */
    saveFeaturePosition(spaceId: string, featureId: string, position: Position3D): void {
        const positions = this.getFeaturePositions(spaceId);
        positions[featureId] = { ...position };
        this.persist(spaceId, positions);
    }

    /**
     * Save all feature positions for a space at once (bulk update).
     */
    saveAllFeaturePositions(spaceId: string, positions: FeaturePositionsMap): void {
        this.persist(spaceId, { ...positions });
    }

    /**
     * Remove a specific feature's position from a space.
     */
    removeFeaturePosition(spaceId: string, featureId: string): void {
        const positions = this.getFeaturePositions(spaceId);
        delete positions[featureId];
        this.persist(spaceId, positions);
    }

    /**
     * Clear all stored positions for a space.
     */
    clearSpacePositions(spaceId: string): void {
        const key = this.buildKey(spaceId);
        localStorage.removeItem(key);
        this.deleteModel(spaceId);
    }

    // ── Model Storage (IndexedDB) ────────────────────────────────

    async saveModel(spaceId: string, file: File | Blob): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put(file, spaceId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getModel(spaceId: string): Promise<Blob | null> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(spaceId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteModel(spaceId: string): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(spaceId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private buildKey(spaceId: string): string {
        return `${this.STORAGE_PREFIX}${spaceId}${this.STORAGE_SUFFIX}`;
    }

    private persist(spaceId: string, positions: FeaturePositionsMap): void {
        const key = this.buildKey(spaceId);
        localStorage.setItem(key, JSON.stringify(positions));
    }
}
