import { Component, OnInit } from '@angular/core';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  walletBalance: string;
  lastUpdatedDateTime: string;
  isLoading: boolean = true;
  labels: any;

  constructor(
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {}

  ngOnInit() {
    this.translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response['payments'] || {};
      });

    this.loadWalletBalance();
  }

  loadWalletBalance() {
    this.isLoading = true;
    const partnerId = this.headerService.getUsername();

    this.dataService.getWalletBalance(partnerId).subscribe(
      (response: any) => {
        if (response && response.response) {
          this.walletBalance = response.response.walletBalance || 'N/A';
          this.lastUpdatedDateTime = response.response.lastUpdatedDateTime || new Date().toLocaleString();
        }
        this.isLoading = false;
        
        // Log audit event
        // this.auditService.audit('ADM-013');
      },
      (error: any) => {
        console.error('Error loading wallet balance:', error);
        this.walletBalance = 'Error';
        this.isLoading = false;
      }
    );
  }

  refreshBalance() {
    this.loadWalletBalance();
  }
}
