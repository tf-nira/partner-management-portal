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

  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {
    this.searchForm = this.formBuilder.group({
      dateRange: [''],
      partner: [''],
      prn: [''],
      category: ['']
    });
  }

  ngOnInit() {
    this.translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response['payments'] || {};
      });
  }

  searchPayments() {
    this.isLoading = true;
    const partnerId = this.headerService.getUsername();
    const filterCriteria = {
      ...this.searchForm.value,
      partnerId
    };

    const request = new RequestModel(
      '',
      null,
      filterCriteria
    );

    this.dataService.searchPayments(request).subscribe(
      (response: any) => {
        if (response && response.response) {
          this.searchResults = response.response.payments || [];
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
