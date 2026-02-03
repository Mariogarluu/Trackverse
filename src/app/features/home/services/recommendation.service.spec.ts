import { TestBed } from '@angular/core/testing';
import { RecommendationService } from './recommendation.service';
import { SupabaseService } from '../../../core/supabase.service';

describe('RecommendationService', () => {
    let service: RecommendationService;
    let supabaseServiceMock: any;
    let queryBuilderMock: any;

    beforeEach(() => {
        // Mocking the query chain for Supabase
        queryBuilderMock = {
            select: jasmine.createSpy('select').and.returnThis(),
            eq: jasmine.createSpy('eq').and.returnThis(),
            in: jasmine.createSpy('in').and.returnValue(Promise.resolve({ data: [], error: null }))
        };

        supabaseServiceMock = {
            client: {
                from: jasmine.createSpy('from').and.returnValue(queryBuilderMock)
            }
        };

        TestBed.configureTestingModule({
            providers: [
                RecommendationService,
                { provide: SupabaseService, useValue: supabaseServiceMock }
            ]
        });
        service = TestBed.inject(RecommendationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update recommendation when dice is rolled with data', async () => {
        const mockDbData = [
            {
                id: '1',
                status: 'watching',
                game: { title: 'Game A', cover_url: 'http://img.com/a' }
            },
            {
                id: '2',
                status: 'pending',
                show: { title: 'Show B', cover_url: 'http://img.com/b' }
            }
        ];

        // Setup mock return
        queryBuilderMock.in.and.returnValue(Promise.resolve({ data: mockDbData, error: null }));

        await service.rollDice('test-user-id');

        const rec = service.recommendation();
        expect(rec).toBeTruthy();
        expect(['1', '2']).toContain(rec!.id);
        expect(service.loading()).toBeFalse();
    });

    it('should handle empty data gracefully', async () => {
        queryBuilderMock.in.and.returnValue(Promise.resolve({ data: [], error: null }));

        await service.rollDice('test-user-id');

        expect(service.recommendation()).toBeNull();
        expect(service.loading()).toBeFalse();
    });

    it('should handle error gracefully', async () => {
        queryBuilderMock.in.and.returnValue(Promise.resolve({ data: null, error: { message: 'Error' } }));

        await service.rollDice('test-user-id');

        expect(service.recommendation()).toBeNull();
        expect(service.loading()).toBeFalse();
    });
});
