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
    mockDataService = jasmine.createSpyObj('DataStorageService', ['generatePRN', 'getPartners']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getlanguageCode', 'getRoleCodes', 'getPartnerId']);
    mockAuditService = jasmine.createSpyObj('AuditService', ['audit']);
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['getTranslation']);

    mockHeaderService.getlanguageCode.and.returnValue('eng');
    mockHeaderService.getRoleCodes.and.returnValue('GLOBAL_ADMIN');
    mockHeaderService.getPartnerId.and.returnValue('PARTNER001');
    mockTranslateService.getTranslation.and.returnValue(of({ payments: {} }));
    mockDataService.getPartners.and.returnValue(of({ response: { data: [{ id: 'PARTNER001', name: 'Partner 001' }] } }));
    mockDataService.generatePRN.and.returnValue(of({ response: { data: { prn: 'PRN123456789' } } }));

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
    component.generatePrnForm.patchValue({
      partnerId: 'PARTNER001',
      partnerType: 'ACCESS',
      partnerGroup: 'PRIVATE',
      numberOfRecords: 5
    });
    component.generatePRN();
    expect(mockDataService.generatePRN).toHaveBeenCalled();
  });
});
