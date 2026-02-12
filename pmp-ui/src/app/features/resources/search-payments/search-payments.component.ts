import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';
import { RequestModel } from 'src/app/core/models/request.model';

@Component({
  selector: 'app-search-payments',
  templateUrl: './search-payments.component.html',
  styleUrls: ['./search-payments.component.scss']
})
export class SearchPaymentsComponent implements OnInit {
  searchForm: FormGroup;
  labels: any;
  isLoading: boolean = false;
  searchResults: any[] = [];
  showResults: boolean = false;
  displayedColumns: any[] = [];
  paginatorOptions: any = {};
  totalRecords: number = 0;
  partners: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {
    this.searchForm = this.formBuilder.group({
      transactionId: [''],
      partnerId: [''],
      entryType: [''],
      amount: [''],
      sourceSystem: [''],
      description: [''],
      crDtimes: ['']
    });
  }

  ngOnInit() {
    this.translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response['payments'] || {};
      });
    
    this.loadPaymentSearchConfig();
    this.loadPartners();
  }

  loadPaymentSearchConfig() {
    this.dataService.getSpecFileForMasterDataEntity('payments-search').subscribe(
      (response: any) => {
        if (response && response.columnsToDisplay) {
          this.displayedColumns = response.columnsToDisplay.filter(
            values => values.showInListView === 'true'
          );
          this.paginatorOptions = response.paginator;
        }
      },
      (error: any) => {
        console.error('Error loading payment search config:', error);
      }
    );
  }

  loadPartners() {
    this.dataService.getPartners().subscribe(
      (response: any) => {
        if (response && response.response && response.response.partners) {
          this.partners = response.response.partners;
        }
      },
      (error: any) => {
        console.error('Error loading partners:', error);
        this.partners = [];
      }
    );
  }

  searchPayments() {
    this.isLoading = true;
    const filterCriteria = this.searchForm.value;

    const request = new RequestModel(
      'mosip.registration.partner.payment.search.1.0',
      null,
      filterCriteria
    );

    this.dataService.searchPayments(request).subscribe(
      (response: any) => {
        if (response && response.response) {
          this.searchResults = response.response.data || [];
          this.totalRecords = response.response.totalRecord || 0;
          this.paginatorOptions.totalEntries = this.totalRecords;
          this.showResults = true;
        }
        this.isLoading = false;
        // this.auditService.audit('ADM-016');
      },
      (error: any) => {
        console.error('Error searching payments:', error);
        this.searchResults = [];
        this.showResults = true;
        this.isLoading = false;
      }
    );
  }

  reset() {
    this.searchForm.reset();
    this.searchResults = [];
    this.showResults = false;
  }

  exportResults() {
    // Export functionality can be implemented here
    console.log('Exporting results...');
  }
}
