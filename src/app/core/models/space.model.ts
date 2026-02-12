export type SpaceType = 'meeting_room' | 'office' | 'bathroom' | 'common_area' | 'storage' | 'kitchen';

export interface Space {
    id: string;
    structureId: string;
    name: string;
    type: SpaceType;
    capacity?: number;
    floor?: string;
    featureIds: string[];
    modelUrl?: string;
    cameraSettings?: {
        position: { x: number; y: number; z: number };
        target: { x: number; y: number; z: number };
    };
    modelScale?: { x: number; y: number; z: number };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSpaceDto {
    structureId: string;
    name: string;
    type: SpaceType;
    capacity?: number;
    floor?: string;
    featureIds?: string[];
    modelUrl?: string;
    cameraSettings?: {
        position: { x: number; y: number; z: number };
        target: { x: number; y: number; z: number };
    };
    modelScale?: { x: number; y: number; z: number };
}

export interface UpdateSpaceDto extends Partial<Omit<CreateSpaceDto, 'structureId'>> { }

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
    meeting_room: 'Meeting Room',
    office: 'Office',
    bathroom: 'Bathroom',
    common_area: 'Common Area',
    storage: 'Storage',
    kitchen: 'Kitchen'
};
