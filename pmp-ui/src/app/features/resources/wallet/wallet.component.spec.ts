import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WalletComponent } from './wallet.component';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';

describe('WalletComponent', () => {
  let component: WalletComponent;
  let fixture: ComponentFixture<WalletComponent>;
  let mockDataService: jasmine.SpyObj<DataStorageService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockAuditService: jasmine.SpyObj<AuditService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataStorageService', ['getWalletBalance']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getUsername', 'getlanguageCode']);
    mockAuditService = jasmine.createSpyObj('AuditService', ['audit']);
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['getTranslation']);

    mockHeaderService.getUsername.and.returnValue('PARTNER001');
    mockHeaderService.getlanguageCode.and.returnValue('eng');
    mockTranslateService.getTranslation.and.returnValue(of({ payments: { walletTitle: 'Wallet Balance' } }));
    mockDataService.getWalletBalance.and.returnValue(
      of({ response: { walletBalance: 'UGX 4750000', lastUpdatedDateTime: '22/03/2025, 12:15 PM' } })
    );

    await TestBed.configureTestingModule({
      declarations: [WalletComponent],
      imports: [MatProgressSpinnerModule, MatIconModule],
      providers: [
        { provide: DataStorageService, useValue: mockDataService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WalletComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load wallet balance on init', () => {
    fixture.detectChanges();
    expect(mockDataService.getWalletBalance).toHaveBeenCalledWith('PARTNER001');
    expect(component.walletBalance).toBe('UGX 4750000');
  });

  it('should refresh balance on button click', () => {
    component.refreshBalance();
    expect(mockDataService.getWalletBalance).toHaveBeenCalled();
  });
});
