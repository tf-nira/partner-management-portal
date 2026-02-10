import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';
import { RequestModel } from 'src/app/core/models/request.model';

@Component({
  selector: 'app-generate-prn',
  templateUrl: './generate-prn.component.html',
  styleUrls: ['./generate-prn.component.scss']
})
export class GeneratePrnComponent implements OnInit {
  generatePrnForm: FormGroup;
  labels: any;
  isLoading: boolean = false;
  generatedPRN: string = '';
  showPRNResult: boolean = false;
  pendingPRNs: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {
    this.generatePrnForm = this.formBuilder.group({
      category: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response['payments'] || {};
      });

    this.loadPendingPRNs();
  }

  generatePRN() {
    if (this.generatePrnForm.invalid) {
      return;
    }

    this.isLoading = true;
    const partnerId = this.headerService.getUsername();
    const category = this.generatePrnForm.get('category').value;

    const request = new RequestModel(
      '',
      null,
      { 'partnerId': partnerId, 'category': category }
    );

    this.dataService.generatePRN(request).subscribe(
      (response: any) => {
        if (response && response.response) {
          this.generatedPRN = response.response.prn || 'N/A';
          this.showPRNResult = true;
        }
        this.isLoading = false;
        // this.auditService.audit('ADM-014');
        this.loadPendingPRNs();
      },
      (error: any) => {
        console.error('Error generating PRN:', error);
        this.isLoading = false;
      }
    );
  }

  loadPendingPRNs() {
    const partnerId = this.headerService.getUsername();
    this.dataService.getPendingPRNs(partnerId).subscribe(
      (response: any) => {
        if (response && response.response) {
          this.pendingPRNs = response.response.prns || [];
        }
      },
      (error: any) => {
        console.error('Error loading pending PRNs:', error);
      }
    );
  }

  closePRNResult() {
    this.showPRNResult = false;
    this.generatedPRN = '';
  }
}
