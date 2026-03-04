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
             <img src="/Tackverse_logo_completo.png" alt="TrackVerse Logo" class="w-full h-auto max-w-[200px]" width="200" height="auto" loading="eager">
        </div>
        <p class="text-slate-500 mt-2">Tu universo de entretenimiento social.</p>
      </div>

      <div class="w-full max-w-sm flex flex-col gap-4">
        
        <!-- Login Form -->
        <div class="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-left">
            
            <!-- Auth Method Selector -->
            <div class="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl">
                <button 
                  type="button" 
                  (click)="setLoginMode('password')" 
                  [class.bg-white]="loginMode() === 'password'" 
                  [class.dark:bg-slate-700]="loginMode() === 'password'" 
                  [class.shadow-sm]="loginMode() === 'password'" 
                  [class.text-slate-500]="loginMode() !== 'password'"
                  class="flex-1 py-2 text-sm font-bold rounded-lg transition-all text-slate-800 dark:text-slate-200">
                  Contraseña
                </button>
                <button 
                  type="button" 
                  (click)="setLoginMode('otp')" 
                  [class.bg-white]="loginMode() === 'otp'" 
                  [class.dark:bg-slate-700]="loginMode() === 'otp'" 
                  [class.shadow-sm]="loginMode() === 'otp'" 
                  [class.text-slate-500]="loginMode() !== 'otp'"
                  class="flex-1 py-2 text-sm font-bold rounded-lg transition-all text-slate-800 dark:text-slate-200">
                  Código al Correo
                </button>
            </div>

            <h2 class="text-xl font-bold mb-4 text-center">
              <ng-container *ngIf="loginMode() === 'password'">{{ isRegistering() ? 'Crear Cuenta' : 'Iniciar Sesión' }}</ng-container>
              <ng-container *ngIf="loginMode() === 'otp'">{{ otpStep() === 'email' ? 'Enviar Código' : 'Verificar Código' }}</ng-container>
            </h2>

            <!-- PASSWORD / REGISTER FORM -->
            <form *ngIf="loginMode() === 'password'" (submit)="onPasswordSubmit()" class="flex flex-col gap-4">
                
                <!-- Step 1: Login or Register Details -->
                <ng-container *ngIf="!isRegistering() || registerStep() === 'details'">
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
                </ng-container>

                <!-- Step 2: Verify Registration OTP -->
                <ng-container *ngIf="isRegistering() && registerStep() === 'verify'">
                    <div>
                        <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Código de Verificación</label>
                        <p class="text-xs text-slate-500 mb-4">Introduce el código de 6 dígitos enviado a {{email}}.</p>
                        <input 
                            type="text" 
                            [(ngModel)]="registerOtpCode" 
                            name="registerOtpCode"
                            required
                            maxlength="6"
                            pattern="[0-9]*"
                            class="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-primary outline-none"
                            placeholder="------"
                        >
                    </div>
                </ng-container>

                <div *ngIf="errorMessage()" class="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                    {{ errorMessage() }}
                </div>

                <div *ngIf="successMessage()" class="text-green-600 dark:text-green-400 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                    {{ successMessage() }}
                </div>

                <button 
                    type="submit" 
                    [disabled]="loading()"
                    class="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span *ngIf="loading()" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>
                        <ng-container *ngIf="!isRegistering()">Entrar</ng-container>
                        <ng-container *ngIf="isRegistering() && registerStep() === 'details'">Registrarse</ng-container>
                        <ng-container *ngIf="isRegistering() && registerStep() === 'verify'">Verificar y Entrar</ng-container>
                    </span>
                </button>

                <div class="mt-2 text-center" *ngIf="!isRegistering() || registerStep() === 'details'">
                    <button type="button" (click)="toggleRegistering()" class="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                        {{ isRegistering() ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate' }}
                    </button>
                </div>
            </form>

            <!-- OTP FORM (Passwordless login) -->
            <form *ngIf="loginMode() === 'otp'" (submit)="onOtpSubmit()" class="flex flex-col gap-4">
                
                <!-- Email Step -->
                <div *ngIf="otpStep() === 'email'">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                    <input 
                        type="email" 
                        [(ngModel)]="email" 
                        name="email"
                        required
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-primary outline-none"
                        placeholder="ejemplo@trackverse.app"
                    >
                    <p class="text-xs text-slate-500 mt-3 text-center">Te enviaremos un código de 6 dígitos al correo. No necesitas contraseña.</p>
                </div>

                <!-- Code Step -->
                <div *ngIf="otpStep() === 'code'">
                   <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Código de 6 dígitos</label>
                    <input 
                        type="text" 
                        [(ngModel)]="otpCode" 
                        name="otpCode"
                        required
                        maxlength="6"
                        pattern="[0-9]*"
                        class="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-primary outline-none"
                        placeholder="------"
                    >
                    <div class="mt-3 text-center">
                        <button type="button" (click)="resetOtpStep()" class="text-xs font-medium text-slate-500 hover:text-primary transition-colors">
                            Volver a enviar código
                        </button>
                    </div>
                </div>

                <div *ngIf="errorMessage()" class="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                    {{ errorMessage() }}
                </div>

                <div *ngIf="successMessage()" class="text-green-600 dark:text-green-400 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                    {{ successMessage() }}
                </div>

                <button 
                    type="submit" 
                    [disabled]="loading()"
                    class="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span *ngIf="loading()" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>{{ otpStep() === 'email' ? 'Enviar Código' : 'Verificar' }}</span>
                </button>
            </form>

        </div>

        <div class="relative flex items-center py-2">
            <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span class="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">O continúa con</span>
            <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        
        <button (click)="handleGoogleLogin()" [disabled]="loading()" class="w-full py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-3 bg-white dark:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed">
           <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </button>
      </div>

      <p class="mt-8 text-xs text-slate-400 font-medium">
        Al continuar aceptas nuestros Términos de Servicio.
      </p>

    </div>
  `
})
export class LoginComponent {
  router = inject(Router);
  supabase = inject(SupabaseService);
  toast = inject(ToastService);

  // General State
  loginMode = signal<'password' | 'otp'>('password');
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Password Flow State
  email = '';
  password = '';
  isRegistering = signal(false);
  registerStep = signal<'details' | 'verify'>('details');
  registerOtpCode = '';

  // OTP Flow State
  otpStep = signal<'email' | 'code'>('email');
  otpCode = '';

  setLoginMode(mode: 'password' | 'otp') {
    this.loginMode.set(mode);
    this.isRegistering.set(false);
    this.registerStep.set('details');
    this.otpStep.set('email');
    this.email = '';
    this.password = '';
    this.otpCode = '';
    this.registerOtpCode = '';
    this.clearMessages();
  }

  toggleRegistering() {
    this.isRegistering.set(!this.isRegistering());
    this.registerStep.set('details');
    this.email = '';
    this.password = '';
    this.registerOtpCode = '';
    this.clearMessages();
  }

  resetOtpStep() {
    this.otpStep.set('email');
    this.otpCode = '';
    this.clearMessages();
  }

  clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async onPasswordSubmit() {
    this.loading.set(true);
    this.clearMessages();

    try {
      if (this.isRegistering()) {
        if (this.registerStep() === 'details') {
          if (!this.email || !this.password) throw new Error('Ingresa email y contraseña.');
          const { data, error } = await this.supabase.signUp(this.email, this.password);
          if (error) throw error;

          const session = data.session;
          if (session) {
            // Auto confirmed
            await this.supabase.checkAndCreateProfile(session.user);
            this.toast.success('Cuenta creada. ¡Bienvenido!');
            this.router.navigate(['/onboarding']);
          } else {
            // OTP needed to confirm email
            this.toast.info('Revisa tu correo electrónico.');
            this.successMessage.set('Hemos enviado un código a tu correo. Introdúcelo abajo para verificar tu cuenta.');
            this.registerStep.set('verify');
          }
        } else if (this.registerStep() === 'verify') {
          if (!this.registerOtpCode || this.registerOtpCode.length !== 6) throw new Error('Ingresa el código de 6 dígitos.');

          const { data, error } = await this.supabase.verifyOtp(this.email, this.registerOtpCode, 'signup');
          if (error) throw error;

          if (data.user) {
            await this.supabase.checkAndCreateProfile(data.user);
          }
          this.toast.success('¡Sesión iniciada! Cuenta verificada.');
          this.router.navigate(['/onboarding']);
        }
      } else {
        if (!this.email || !this.password) throw new Error('Ingresa email y contraseña.');
        const { data, error } = await this.supabase.signInWithPassword(this.email, this.password);
        if (error) throw error;

        if (data.user) {
          await this.supabase.checkAndCreateProfile(data.user);
        }
        this.router.navigate(['/home']);
      }
    } catch (e: any) {
      this.handleAuthError(e);
    } finally {
      this.loading.set(false);
    }
  }

  async onOtpSubmit() {
    this.loading.set(true);
    this.clearMessages();

    try {
      if (this.otpStep() === 'email') {
        if (!this.email) throw new Error('Ingresa un email válido.');

        const { error } = await this.supabase.signInWithEmail(this.email);
        if (error) throw error;

        this.otpStep.set('code');
        this.successMessage.set('Código enviado. Revisa tu correo electrónico.');
        this.toast.success('Código enviado al correo');
      } else {
        if (!this.otpCode || this.otpCode.length !== 6) throw new Error('Ingresa el código de 6 dígitos.');

        const { data, error } = await this.supabase.verifyOtp(this.email, this.otpCode, 'email');
        if (error) throw error;

        if (data.user) {
          await this.supabase.checkAndCreateProfile(data.user);
        }

        this.toast.success('¡Sesión iniciada!');
        this.router.navigate(['/home']);
      }
    } catch (e: any) {
      this.handleAuthError(e);
    } finally {
      this.loading.set(false);
    }
  }

  async handleGoogleLogin() {
    try {
      this.loading.set(true);
      const { error } = await this.supabase.signInWithGoogle();
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase Auth not configured. Falling back to mock session.');
      localStorage.setItem('trackverse_mock_session', 'true');
      this.router.navigate(['/home']);
    } finally {
      this.loading.set(false);
    }
  }

  private handleAuthError(e: any) {
    console.error(e);
    let msg = e.message || 'Error de autenticación';

    if (msg.includes('Email not confirmed')) {
      msg = 'Tu email no ha sido confirmado. Por favor revisa tu bandeja de entrada.';
    } else if (msg.includes('Invalid login credentials')) {
      msg = 'Credenciales incorrectas.';
    } else if (msg.includes('User already registered')) {
      msg = 'Este email ya está registrado. Intenta iniciar sesión.';
    } else if (msg.includes('Token has expired or is invalid') || msg.includes('Email link is invalid or has expired')) {
      msg = 'El código es inválido o ha expirado.';
    } else if (msg.includes('Database error saving new user')) {
      msg = 'Error al registrar usuario. Asegúrate de poner una contraseña.';
    }

    this.errorMessage.set(msg);
    this.toast.error(msg);
  }
}
