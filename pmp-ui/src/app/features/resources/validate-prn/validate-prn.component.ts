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
  isPartnerDropdownDisabled: boolean = false;

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
        if (response && response.response && response.response.data) {
          // Extract partner IDs from the response data array
          this.partners = response.response.data.map((partner: any) => ({
            id: partner.id,
            name: partner.name
          }));

          // Check if user is not global admin or partner admin
          const roles = this.headerService.getRoleCodes();
          const isAdmin = roles.includes('GLOBAL_ADMIN') || roles.includes('PARTNER_ADMIN');
          
          if (!isAdmin) {
            // For non-admin users, set the logged-in partner as default and disable the dropdown
            const loggedInPartnerId = this.headerService.getPartnerId();
            
            if (loggedInPartnerId) {
              this.validatePrnForm.patchValue({ partnerName: loggedInPartnerId });
              this.isPartnerDropdownDisabled = true;
            }
          }
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
        this.isLoading = false;
        if (response && response.response) {
          this.validationResult = response.response;

          if (response.response.statusCode === 'A') {
            this.isValid = true;
          } else {
            this.isValid = false;
          }
          this.showValidationResult = true;
          
        } else if (response && response.errors && response.errors.length > 0) {
          // API-level errors array
          this.isValid = false;
          const errorDesc = response.errors[0] && response.errors[0].message 
                          ? response.errors[0].message 
                          : 'Validation failed';
          this.validationResult = { statusDesc: errorDesc } as any;
          this.showValidationResult = true;
          
        } else {
          // Empty/malformed response
          this.isValid = false;
          this.validationResult = { statusDesc: 'Invalid response format' };
          this.showValidationResult = true;
        }
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
    
    this.validatePrnForm.patchValue({ 
    partnerName: '',
    prn: '' 
  });
  }
}
