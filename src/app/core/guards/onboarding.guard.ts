import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, UrlTree } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Injectable({
    providedIn: 'root'
})
export class OnboardingGuard implements CanActivate {
    /**
     * Onboarding desactivado temporalmente:
     * siempre permite el acceso a las rutas protegidas.
     */
    async canActivate(): Promise<boolean | UrlTree> {
        return true;
    }
}

/**
 * Guard to prevent users who HAVE completed onboarding from seeing it again
 */
@Injectable({
    providedIn: 'root'
})
export class AlreadyOnboardedGuard implements CanActivate {
    /**
     * Onboarding desactivado:
     * se permite siempre entrar a /login sin redirecciones.
     */
    async canActivate(): Promise<boolean | UrlTree> {
        return true;
    }
}
