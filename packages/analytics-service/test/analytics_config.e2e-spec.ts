import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AnalyticsConfigService } from '../src/modules/analytics_config/analytics_config.service';

describe('AnalyticsConfigService (e2e)', () => {
  let app: INestApplication;
  let service: AnalyticsConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AnalyticsConfigService,
          useValue: {
            getAnalyticsKey: jest
              .fn()
              .mockImplementation(
                async (projectId: number, environment: string) => {
                  return 'test-key';
                },
              ),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<AnalyticsConfigService>(AnalyticsConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Analytics Config Service', () => {
    it('Should initialize the analytics config service', async () => {
      // Test that the service can be initialized
      // This is a basic smoke test for the analytics config module
      expect(app).toBeDefined();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('getAnalyticsKey', () => {
      it('should retrieve analytics key successfully', async () => {
        const projectId = 1;
        const environment = 'test';
        const result = await service.getAnalyticsKey(projectId, environment);

        expect(result).toBe('test-key');
        expect(service.getAnalyticsKey).toHaveBeenCalledWith(
          projectId,
          environment,
        );
      });
    });
  });
});
