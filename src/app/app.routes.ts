import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
            { path: '', redirectTo: 'structures', pathMatch: 'full' },
            {
                path: 'structures',
                loadChildren: () => import('./features/structures/structures.routes').then(m => m.STRUCTURES_ROUTES)
            },
            {
                path: 'features',
                loadChildren: () => import('./features/features/features.routes').then(m => m.FEATURES_ROUTES)
            }
        ]
    },
    { path: '**', redirectTo: 'structures' }
];
