import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    message: string;
    type: ToastType;
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);

    show(message: string, type: ToastType = 'info') {
        const id = Date.now();
        const toast: Toast = { message, type, id };

        this.toasts.update(current => [...current, toast]);

        // Auto dismiss
        setTimeout(() => {
            this.remove(id);
        }, 3000);
    }

    remove(id: number) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }

    success(message: string) { this.show(message, 'success'); }
    error(message: string) { this.show(message, 'error'); }
    info(message: string) { this.show(message, 'info'); }
}
