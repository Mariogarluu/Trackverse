import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LibraryComponent } from './features/library/library.component';
import { SearchComponent } from './features/search/search.component';
import { AuthGuard } from './core/auth.guard';

import { ProfileComponent } from './features/profile/profile.component';
import { LoginComponent } from './core/login/login.component';
import { OnboardingComponent } from './features/onboarding/onboarding.component';
import { OnboardingGuard, AlreadyOnboardedGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        // If already logged in & onboarded, go to home. If not onboarded, go to onboarding.
        canActivate: [AlreadyOnboardedGuard]
    },
    {
        path: 'onboarding',
        component: OnboardingComponent,
        canActivate: [AuthGuard] // Must be logged in to do onboarding
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [AuthGuard, OnboardingGuard]
    },
    {
        path: 'library',
        component: LibraryComponent,
        canActivate: [AuthGuard, OnboardingGuard]
    },
    {
        path: 'search',
        component: SearchComponent,
        canActivate: [AuthGuard, OnboardingGuard]
    },
    {
        path: 'social',
        loadComponent: () => import('./features/social/social.component').then(m => m.SocialComponent),
        canActivate: [AuthGuard, OnboardingGuard]
    },
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard, OnboardingGuard]
    },
    {
        path: '**',
        redirectTo: 'home'
    }
];
