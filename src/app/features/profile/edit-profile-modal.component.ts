import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';
import { ToastService } from '../../core/toast.service';
import { Database } from '../../models/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div (click)="close.emit()" class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl overflow-hidden animate-scale-up border border-slate-100 dark:border-slate-800">
        
        <div class="p-6">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Editar Perfil</h2>

          <!-- Avatar Upload -->
          <div class="flex flex-col items-center mb-8">
            <div class="relative group cursor-pointer" (click)="fileInput.click()">
              <div class="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-surface-light dark:border-surface-dark shadow-lg">
                <img 
                  [src]="previewUrl() || profile?.avatar_url || 'assets/placeholder-user.jpg'" 
                  class="w-full h-full object-cover"
                >
                <!-- Overlay -->
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="text-white text-xs font-bold">CAMBIAR</span>
                </div>
              </div>
              <div class="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-sm border-2 border-surface-light dark:border-surface-dark">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
              </div>
            </div>
            <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
          </div>

          <!-- Fields -->
          <div class="space-y-4">
             <div>
               <label class="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre de Usuario</label>
               <input 
                 type="text" 
                 [(ngModel)]="formData.username"
                 class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-slate-100"
               >
             </div>

             <div>
               <label class="block text-xs font-bold uppercase text-slate-400 mb-1">Biografía</label>
               <textarea 
                 [(ngModel)]="formData.bio"
                 rows="3"
                 class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-slate-100 resize-none"
               ></textarea>
             </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-4 mt-8">
            <button (click)="close.emit()" class="flex-1 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 font-bold">
              Cancelar
            </button>
            <button 
              (click)="save()" 
              [disabled]="saving()"
              class="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <span *ngIf="saving()" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              <span>{{ saving() ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class EditProfileModalComponent {
  @Input() profile: Profile | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  supabase = inject(SupabaseService);
  toast = inject(ToastService);

  formData = { username: '', bio: '' };
  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);
  saving = signal(false);

  ngOnChanges() {
    if (this.profile) {
      this.formData = {
        username: this.profile.username || '',
        bio: this.profile.bio || ''
      };
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async save() {
    if (this.saving()) return;
    this.saving.set(true);

    try {
      let avatarUrl = this.profile?.avatar_url;

      // 1. Upload Avatar if selected
      if (this.selectedFile) {
        avatarUrl = await this.supabase.uploadAvatar(this.selectedFile);
      }

      // 2. Update Profile
      await this.supabase.updateProfile({
        username: this.formData.username,
        bio: this.formData.bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });

      this.toast.success('Perfil actualizado con éxito!');
      this.profileUpdated.emit();
      this.close.emit();

    } catch (error: any) {
      console.error(error);
      this.toast.error('Error al actualizar perfil.');
    } finally {
      this.saving.set(false);
    }
  }
}
