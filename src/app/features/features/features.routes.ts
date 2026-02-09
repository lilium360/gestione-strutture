import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const FEATURES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./features-list/features-list.component').then(m => m.FeaturesListComponent)
    },
    {
        path: 'new',
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./feature-form/feature-form.component').then(m => m.FeatureFormComponent)
    },
    {
        path: ':id/edit',
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./feature-form/feature-form.component').then(m => m.FeatureFormComponent)
    }
];
