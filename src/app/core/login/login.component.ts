import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
      
      <div class="mb-8">
        <!-- Logo -->
        <div class="mx-auto flex justify-center mb-6">
             <img src="/Tackverse_logo_completo.png" alt="TrackVerse Logo" class="w-full h-auto max-w-[200px]">
        </div>
        <p class="text-slate-500 mt-2">Tu universo de entretenimiento social.</p>
      </div>

      <div class="w-full max-w-sm flex flex-col gap-4">
        <button (click)="handleEmailLogin()" class="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <span>Continuar con Email</span>
        </button>
        
        <button (click)="handleGoogleLogin()" class="w-full py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2">
           <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
      </div>

      <p class="mt-8 text-xs text-slate-400">
        Al continuar aceptas nuestros Términos de Servicio.
      </p>

    </div>
  `
})
export class LoginComponent {
  router = inject(Router);
  supabase = inject(SupabaseService);

  async handleGoogleLogin() {
    try {
      const { error } = await this.supabase.signInWithGoogle();
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase Auth not configured. Falling back to mock session.');
      localStorage.setItem('trackverse_mock_session', 'true');
      this.router.navigate(['/home']);
    }
  }

  handleEmailLogin() {
    // Placeholder
    alert('Por favor usa Google para iniciar sesión por ahora.');
  }
}
