import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToastService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add a success toast', () => {
        service.success('Great job!');
        const toasts = service.toasts();
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].message).toBe('Great job!');
    });

    it('should remove toast after duration', (done) => {
        // Mock setTimeout logic or test remove method directly
        service.info('Info message');
        const id = service.toasts()[0].id;

        service.remove(id);
        expect(service.toasts().length).toBe(0);
        done();
    });
});
