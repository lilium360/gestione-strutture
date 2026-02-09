import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';
import { Location } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {
    constructor(
        protected override readonly router: Router,
        protected readonly keycloak: KeycloakService,
        private readonly location: Location
    ) {
        super(router, keycloak);
    }

    public async isAccessAllowed(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        if (!this.authenticated) {
            // prepareExternalUrl correctly handles the baseHref (e.g. /gestione-strutture/)
            const url = window.location.origin + this.location.prepareExternalUrl(state.url);

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
