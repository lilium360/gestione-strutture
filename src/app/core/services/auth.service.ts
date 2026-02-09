import { Injectable, computed, inject, signal } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Location } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly keycloak = inject(KeycloakService);
    private readonly location = inject(Location);

    isAdmin = computed(() => this.keycloak.getUserRoles().includes('admin'));
    isViewer = computed(() => this.keycloak.getUserRoles().includes('viewer'));

    constructor() { }

    logout(): void {
        this.keycloak.logout(window.location.origin + this.location.prepareExternalUrl(''));
    }

    getRoles(): string[] {
        return this.keycloak.getUserRoles();
    }
}
