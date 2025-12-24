import { Routes } from '@angular/router';

export const STRUCTURES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./structures-list/structures-list.component').then(m => m.StructuresListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./structure-form/structure-form.component').then(m => m.StructureFormComponent)
    },
    // Space routes MUST come before :id to match correctly
    {
        path: ':structureId/spaces/new',
        loadComponent: () => import('./space-form/space-form.component').then(m => m.SpaceFormComponent)
    },
    {
        path: ':structureId/spaces/:spaceId/edit',
        loadComponent: () => import('./space-form/space-form.component').then(m => m.SpaceFormComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./structure-form/structure-form.component').then(m => m.StructureFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./structure-detail/structure-detail.component').then(m => m.StructureDetailComponent)
    }
];
