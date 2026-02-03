import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div 
        *ngFor="let toast of toastService.toasts()" 
        class="pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in-up min-w-[200px] flex items-center gap-2"
        [ngClass]="{
          'bg-slate-800': toast.type === 'info',
          'bg-green-600': toast.type === 'success',
          'bg-red-500': toast.type === 'error'
        }"
      >
        <span>{{ toast.message }}</span>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
