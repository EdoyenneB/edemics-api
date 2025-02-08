import { Test, TestingModule } from '@nestjs/testing';
import { SchoolSetupController } from './school-setup.controller';

describe('SchoolSetupController', () => {
  let controller: SchoolSetupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolSetupController],
    }).compile();

    controller = module.get<SchoolSetupController>(SchoolSetupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
