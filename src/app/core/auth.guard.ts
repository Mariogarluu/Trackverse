import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    async canActivate(): Promise<boolean | UrlTree> {
        const { data: { session } } = await this.supabase.client.auth.getSession();

        if (!session) {
            // Redirect to allowed login page
            return this.router.createUrlTree(['/login']);
        }
        return true;
    }
}
