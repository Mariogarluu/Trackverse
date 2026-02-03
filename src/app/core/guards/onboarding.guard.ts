import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, UrlTree } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Injectable({
    providedIn: 'root'
})
export class OnboardingGuard implements CanActivate {
    private router = inject(Router);
    private supabase = inject(SupabaseService);

    async canActivate(): Promise<boolean | UrlTree> {
        const { data: { user } } = await this.supabase.client.auth.getUser();

        if (!user) {
            return this.router.createUrlTree(['/login']);
        }

        // Check profile
        const { data: profile } = await this.supabase.client
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        if (profile && !(profile as any).onboarding_completed) {
            // Must do onboarding
            return true;
        }

        // Already completed, go home
        return this.router.createUrlTree(['/home']);
    }
}

/**
 * Guard to prevent users who HAVE completed onboarding from seeing it again
 */
@Injectable({
    providedIn: 'root'
})
export class AlreadyOnboardedGuard implements CanActivate {
    private router = inject(Router);
    private supabase = inject(SupabaseService);

    async canActivate(): Promise<boolean | UrlTree> {
        const { data: { user } } = await this.supabase.client.auth.getUser();

        // If not logged in, allow access to the route (e.g. Login page)
        if (!user) {
            return true;
        }

        const { data: profile } = await this.supabase.client
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        // If logged in and onboarding completed -> Go Home
        if (profile && (profile as any).onboarding_completed) {
            return this.router.createUrlTree(['/home']);
        }

        // If logged in but NOT completed -> Go Onboarding
        return this.router.createUrlTree(['/onboarding']);
    }
}
