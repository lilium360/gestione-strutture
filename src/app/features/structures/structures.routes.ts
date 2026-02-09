import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const STRUCTURES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./structures-list/structures-list.component').then(m => m.StructuresListComponent)
    },
    {
        path: 'new',
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./structure-form/structure-form.component').then(m => m.StructureFormComponent)
    },
    // Space routes MUST come before :id to match correctly
    {
        path: ':structureId/spaces/new',
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./space-form/space-form.component').then(m => m.SpaceFormComponent)
    },
    {
        path: ':structureId/spaces/:spaceId/edit',
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./space-form/space-form.component').then(m => m.SpaceFormComponent)
    },
    {
        path: ':id/edit',
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./structure-form/structure-form.component').then(m => m.StructureFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./structure-detail/structure-detail.component').then(m => m.StructureDetailComponent)
    }
];
