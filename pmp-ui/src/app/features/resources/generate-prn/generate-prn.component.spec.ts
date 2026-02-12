import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneratePrnComponent } from './generate-prn.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('GeneratePrnComponent', () => {
  let component: GeneratePrnComponent;
  let fixture: ComponentFixture<GeneratePrnComponent>;
  let mockDataService: jasmine.SpyObj<DataStorageService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockAuditService: jasmine.SpyObj<AuditService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataStorageService', ['generatePRN', 'getPendingPRNs']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getUsername', 'getlanguageCode']);
    mockAuditService = jasmine.createSpyObj('AuditService', ['audit']);
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['getTranslation']);

    mockHeaderService.getUsername.and.returnValue('PARTNER001');
    mockHeaderService.getlanguageCode.and.returnValue('eng');
    mockTranslateService.getTranslation.and.returnValue(of({ payments: {} }));
    mockDataService.generatePRN.and.returnValue(of({ response: { prn: 'PRN123456789' } }));

    await TestBed.configureTestingModule({
      declarations: [GeneratePrnComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: DataStorageService, useValue: mockDataService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GeneratePrnComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate PRN on form submit', () => {
    component.generatePrnForm.patchValue({ category: 'service1' });
    component.generatePRN();
    expect(mockDataService.generatePRN).toHaveBeenCalled();
  });
});
