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
}

export interface UpdateStructureDto extends Partial<CreateStructureDto> { }
