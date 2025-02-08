import { Test, TestingModule } from '@nestjs/testing';
import { SchoolSetupService } from './school-setup.service';

describe('SchoolSetupService', () => {
  let service: SchoolSetupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolSetupService],
    }).compile();

    service = module.get<SchoolSetupService>(SchoolSetupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
