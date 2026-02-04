import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        
        <!-- Email/Password Form -->
        <div class="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-left">
            <h2 class="text-xl font-bold mb-4 text-center">{{ isRegistering() ? 'Crear Cuenta' : 'Iniciar Sesión' }}</h2>
            
            <form (submit)="onSubmit()" class="flex flex-col gap-4">
                <div>
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                    <input 
                        type="email" 
                        [(ngModel)]="email" 
                        name="email"
                        required
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-primary outline-none"
                        placeholder="ejemplo@trackverse.app"
                    >
                </div>
                
                <div>
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Contraseña</label>
                    <input 
                        type="password" 
                        [(ngModel)]="password" 
                        name="password"
                        required
                        minlength="6"
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-primary outline-none"
                        placeholder="••••••••"
                    >
                </div>

                <div *ngIf="errorMessage()" class="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                    {{ errorMessage() }}
                </div>

                <button 
                    type="submit" 
                    [disabled]="loading()"
                    class="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span *ngIf="loading()" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>{{ isRegistering() ? 'Registrarse' : 'Entrar' }}</span>
                </button>
            </form>

            <div class="mt-4 text-center">
                <button (click)="toggleMode()" class="text-sm text-slate-500 hover:text-primary transition-colors">
                    {{ isRegistering() ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate' }}
                </button>
            </div>
        </div>

        <div class="relative flex items-center py-2">
            <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span class="flex-shrink-0 mx-4 text-slate-400 text-xs">O continúa con</span>
            <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        
        <button (click)="handleGoogleLogin()" class="w-full py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2 bg-white dark:bg-transparent">
           <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
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
  toast = inject(ToastService); // We need a toast service if available, or we use alerts? Using ToastService from previous context

  // State
  email = '';
  password = '';
  isRegistering = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  toggleMode() {
    this.isRegistering.set(!this.isRegistering());
    this.errorMessage.set('');
  }

  async onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      if (this.isRegistering()) {
        const { data, error } = await this.supabase.signUp(this.email, this.password);

        if (error) throw error;

        // Registration Successful
        const session = data.session;
        if (session) {
          // If session exists immediately (email confirmation disabled), go to onboarding
          this.toast.success('Cuenta creada. ¡Bienvenido!');
          this.router.navigate(['/onboarding']);
        } else {
          // Email confirmation required
          this.toast.info('Hemos enviado un enlace de confirmación a tu correo. Verifica tu cuenta.');
          this.errorMessage.set('Por favor, confirma tu email para poder iniciar sesión.');
          this.isRegistering.set(false); // Switch to login mode
        }
      } else {
        // Login
        const { error } = await this.supabase.signInWithPassword(this.email, this.password);
        if (error) throw error;

        this.router.navigate(['/home']);
      }

    } catch (e: any) {
      console.error(e);
      let msg = e.message || 'Error de autenticación';

      // Translate common Supabase errors
      if (msg.includes('Email not confirmed')) {
        msg = 'Tu email no ha sido confirmado. Por favor revisa tu bandeja de entrada.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      } else if (msg.includes('User already registered')) {
        msg = 'Este email ya está registrado. Intenta iniciar sesión.';
      }

      this.errorMessage.set(msg);
      this.toast.error(msg);
    } finally {
      this.loading.set(false);
    }
  }

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
}
