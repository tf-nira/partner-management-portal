import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidatePrnComponent } from './validate-prn.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('ValidatePrnComponent', () => {
  let component: ValidatePrnComponent;
  let fixture: ComponentFixture<ValidatePrnComponent>;

  beforeEach(async () => {
    const mockDataService = jasmine.createSpyObj('DataStorageService', ['validatePRN']);
    const mockHeaderService = jasmine.createSpyObj('HeaderService', ['getUsername', 'getlanguageCode']);
    const mockAuditService = jasmine.createSpyObj('AuditService', ['audit']);
    const mockTranslateService = jasmine.createSpyObj('TranslateService', ['getTranslation']);

    mockHeaderService.getUsername.and.returnValue('PARTNER001');
    mockHeaderService.getlanguageCode.and.returnValue('eng');
    mockTranslateService.getTranslation.and.returnValue(of({ payments: {} }));
    mockDataService.validatePRN.and.returnValue(of({ response: { isValid: true } }));

    await TestBed.configureTestingModule({
      declarations: [ValidatePrnComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: DataStorageService, useValue: mockDataService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ValidatePrnComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
