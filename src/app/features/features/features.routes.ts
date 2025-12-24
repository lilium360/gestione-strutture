import { Routes } from '@angular/router';

export const FEATURES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./features-list/features-list.component').then(m => m.FeaturesListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./feature-form/feature-form.component').then(m => m.FeatureFormComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./feature-form/feature-form.component').then(m => m.FeatureFormComponent)
    }
];
