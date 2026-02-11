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
  isSuccess: boolean = false;
  errorMessage: string = '';
  partners: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {
    this.generatePrnForm = this.formBuilder.group({
      partnerName: ['', Validators.required],
      amount: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response['payments'] || {};
      });

    this.loadPartners();
  }

  loadPartners() {
    // Load list of partners for dropdown
    this.dataService.getPartners().subscribe(
      (response: any) => {
        if (response && response.response) {
          this.partners = response.response.partners || [];
        }
      },
      (error: any) => {
        console.error('Error loading partners:', error);
      }
    );
  }

  generatePRN() {
    if (this.generatePrnForm.invalid) {
      return;
    }

    this.isLoading = true;
    const partnerId = this.headerService.getUsername();
    const partnerName = this.generatePrnForm.get('partnerName').value;
    const amount = this.generatePrnForm.get('amount').value;

    const request = new RequestModel(
      '',
      null,
      { 'partnerId': partnerId, 'partnerName': partnerName, 'amount': amount }
    );

    this.dataService.generatePRN(request).subscribe(
      (response: any) => {
        if (response && response.response && response.response.prn) {
          this.generatedPRN = response.response.prn;
          this.isSuccess = true;
          this.errorMessage = '';
        } else {
          this.isSuccess = false;
          this.errorMessage = 'PRN generation failed, please try again';
        }
        this.showPRNResult = true;
        this.isLoading = false;
        this.auditService.audit('ADM-014');
      },
      (error: any) => {
        console.error('Error generating PRN:', error);
        this.isSuccess = false;
        this.errorMessage = 'PRN generation failed, please try again';
        this.showPRNResult = true;
        this.isLoading = false;
      }
    );
  }

  closePRNResult() {
    this.showPRNResult = false;
    this.generatedPRN = '';
    this.errorMessage = '';
    this.generatePrnForm.reset();
  }
}
