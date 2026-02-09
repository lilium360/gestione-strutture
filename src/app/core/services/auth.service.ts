import { Injectable, computed, inject, signal } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly keycloak = inject(KeycloakService);

    isAdmin = computed(() => this.keycloak.getUserRoles().includes('admin'));
    isViewer = computed(() => this.keycloak.getUserRoles().includes('viewer'));

    constructor() { }

    logout(): void {
        this.keycloak.logout(window.location.origin);
    }

    getRoles(): string[] {
        return this.keycloak.getUserRoles();
    }
}
