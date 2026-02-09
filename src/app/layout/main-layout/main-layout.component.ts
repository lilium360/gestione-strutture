import { Component, signal, computed, ChangeDetectionStrategy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    ConfirmDialogComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly keycloak = inject(KeycloakService);

  isCollapsed = signal(false);
  isMobileOpen = signal(false);
  isDarkMode = signal(true);
  isLogoutDialogOpen = signal(false);

  userProfile = signal<KeycloakProfile | null>(null);
  userInitials = computed(() => {
    const profile = this.userProfile();
    if (!profile) return 'U';

    const first = profile.firstName?.charAt(0) || '';
    const last = profile.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || profile.username?.charAt(0).toUpperCase() || 'U';
  });

  userName = computed(() => {
    const profile = this.userProfile();
    return profile ? `${profile.firstName} ${profile.lastName}` : 'User';
  });

  navItems: NavItem[] = [
    { label: 'Structures', path: '/structures', icon: 'building' },
    { label: 'Features', path: '/features', icon: 'layers' }
  ];

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.isDarkMode.set(savedTheme === 'dark');
      }
      this.applyTheme();

      try {
        if (await this.keycloak.isLoggedIn()) {
          const profile = await this.keycloak.loadUserProfile();
          this.userProfile.set(profile);
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    }
  }

  toggleSidebarOrMobile(): void {
    if (window.innerWidth <= 1024) {
      this.isMobileOpen.update(v => !v);
    } else {
      this.isCollapsed.update(v => !v);
    }
  }

  closeMobileMenu(): void {
    this.isMobileOpen.set(false);
  }

  toggleTheme(): void {
    this.isDarkMode.update(v => !v);
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
    }
  }

  private applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.isDarkMode()) {
        this.document.documentElement.classList.add('dark');
      } else {
        this.document.documentElement.classList.remove('dark');
      }
    }
  }

  onLogoutClick(): void {
    this.isLogoutDialogOpen.set(true);
  }

  handleLogoutConfirm(): void {
    this.isLogoutDialogOpen.set(false);
    this.keycloak.logout(window.location.origin);
  }

  handleLogoutCancel(): void {
    this.isLogoutDialogOpen.set(false);
  }
}
