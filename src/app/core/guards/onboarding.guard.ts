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
        if (!user) return this.router.createUrlTree(['/login']);

        const { data: profile } = await this.supabase.client
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        if (profile && (profile as any).onboarding_completed) {
            // Completed? Logic is inverted. 
            // If completed, allowed to go anywhere? No, this guard is for the /onboarding route specifically?
            // Wait, usually you want:
            // - Main App Routes: Check if onboarding is done. (If NOT done -> redirect to onboarding)
            // - Onboarding Route: Check if onboarding is done. (If DONE -> redirect to home)

            // This Guard is for the MAIN APP routes.
            return true;
        }

        // Not completed? Redirect to onboarding
        return this.router.createUrlTree(['/onboarding']);
    }
}
