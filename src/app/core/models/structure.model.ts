export interface FloorPlanimetry {
    id: string;
    level: string; // e.g., "0", "1", "PT"
    name: string;  // e.g., "Ground Floor"
    url: string;
    corners: { lat: number; lng: number }[];
    opacity: number;
}

export interface Structure {
    id: string;
    name: string;
    address: string;
    city: string;
    description?: string;
    // Business details
    openingHours?: string;
    phone?: string;
    email?: string;
    // For map display
    coordinates: {
        lat: number;
        lng: number;
    };
    imageUrl?: string;

    // Support for multiple floors
    floors?: FloorPlanimetry[];

    // Legacy single planimetry support
    planimetryUrl?: string;
    planimetryCorners?: { lat: number; lng: number }[];
    planimetryOpacity?: number;

    createdAt: Date;
    updatedAt: Date;
}


export interface CreateStructureDto {
    name: string;
    address: string;
    city: string;
    description?: string;
    openingHours?: string;
    phone?: string;
    email?: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    imageUrl?: string;
    floors?: FloorPlanimetry[];

    // Legacy support
    planimetryUrl?: string;
    planimetryCorners?: { lat: number; lng: number }[];
    planimetryOpacity?: number;
}


export interface UpdateStructureDto extends Partial<CreateStructureDto> { }
