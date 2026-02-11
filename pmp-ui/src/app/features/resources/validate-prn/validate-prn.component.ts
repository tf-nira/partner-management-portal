import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';
import { RequestModel } from 'src/app/core/models/request.model';

@Component({
  selector: 'app-validate-prn',
  templateUrl: './validate-prn.component.html',
  styleUrls: ['./validate-prn.component.scss']
})
export class ValidatePrnComponent implements OnInit {
  validatePrnForm: FormGroup;
  labels: any;
  isLoading: boolean = false;
  validationResult: any = null;
  showValidationResult: boolean = false;
  isValid: boolean = false;
  partners: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {
    this.validatePrnForm = this.formBuilder.group({
      partnerName: ['', Validators.required],
      prn: ['', Validators.required]
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

  validatePRN() {
    if (this.validatePrnForm.invalid) {
      return;
    }

    this.isLoading = true;
    const partnerId = this.validatePrnForm.get('partnerName').value;
    const prn = this.validatePrnForm.get('prn').value;

    const request = new RequestModel(
      'mosip.registration.processor.prn.validate.1.0',
      null,
      {
        'prn': prn,
        'partnerId': partnerId,
        'serviceCode': '',
        'amount': ''
      }
    );

    this.dataService.validatePRN(request).subscribe(
      (response: any) => {
        if (response && response.response) {
          this.validationResult = response.response;
          // Check if validation was successful based on statusCode
          this.isValid = response.response.statusCode === 'PAYMENT_SUCCESS';
          this.showValidationResult = true;
        }
        this.isLoading = false;
        // this.auditService.audit('ADM-015');
      },
      (error: any) => {
        console.error('Error validating PRN:', error);
        this.isValid = false;
        const errorMessage = (error && error.error && error.error.response && error.error.response.statusDesc) 
          ? error.error.response.statusDesc 
          : 'PRN validation failed';
        this.validationResult = { statusDesc: errorMessage };
        this.showValidationResult = true;
        this.isLoading = false;
      }
    );
  }

  closeValidationResult() {
    this.showValidationResult = false;
    this.validationResult = null;
    this.validatePrnForm.reset();
  }
}
