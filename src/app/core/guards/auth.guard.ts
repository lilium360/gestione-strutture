import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';
import { PlatformLocation } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {
    constructor(
        protected override readonly router: Router,
        protected readonly keycloak: KeycloakService,
        private readonly platformLocation: PlatformLocation
    ) {
        super(router, keycloak);
    }

    public async isAccessAllowed(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        if (!this.authenticated) {
            const baseHref = this.platformLocation.getBaseHrefFromDOM();
            const safeBase = baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref;
            const url = window.location.origin + safeBase + state.url;

            await this.keycloak.login({
                redirectUri: url
            });
        }

        const requiredRoles = route.data['roles'];

        if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
            return true;
        }

        return requiredRoles.every((role) => this.roles.includes(role));
    }
}
