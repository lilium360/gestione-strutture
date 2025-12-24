export type FeatureCategory = 'connectivity' | 'equipment' | 'accessibility' | 'comfort';

export interface Feature {
    id: string;
    name: string;
    icon: string;
    category: FeatureCategory;
    description?: string;
}

export interface CreateFeatureDto {
    name: string;
    icon: string;
    category: FeatureCategory;
    description?: string;
}

export interface UpdateFeatureDto extends Partial<CreateFeatureDto> { }

export const FEATURE_CATEGORY_LABELS: Record<FeatureCategory, string> = {
    connectivity: 'Connectivity',
    equipment: 'Equipment',
    accessibility: 'Accessibility',
    comfort: 'Comfort'
};
