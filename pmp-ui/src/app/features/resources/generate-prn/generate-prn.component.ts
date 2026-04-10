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
  isPartnerDropdownDisabled: boolean = false;
  isPartnerTypeDisabled: boolean = false;
  isPartnerGroupDisabled: boolean = false;
  partnerTypeOptions: string[] = ['ACCESS', 'VERIFY'];
  partnerGroupOptions: string[] = ['GOV', 'PRIVATE', 'FOREIGN'];
  readonly partnerGroupByType: { [key: string]: string[] } = {
    ACCESS: ['GOV', 'PRIVATE', 'FOREIGN'],
    VERIFY: ['GOV', 'PRIVATE']
  };

  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {
    this.generatePrnForm = this.formBuilder.group({
      partnerId: ['', Validators.required],
      partnerType: ['ACCESS', Validators.required],
      partnerGroup: ['PRIVATE', Validators.required],
      numberOfRecords: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response['payments'] || {};
      });

    this.loadPartners();
    this.updatePartnerGroupOptions(this.generatePrnForm.get('partnerType').value);
    this.generatePrnForm.get('partnerType').valueChanges.subscribe((selectedPartnerType: string) => {
      this.updatePartnerGroupOptions(selectedPartnerType);
    });
  }

  updatePartnerGroupOptions(partnerType: string) {
    this.partnerGroupOptions = this.partnerGroupByType[partnerType] ? [...this.partnerGroupByType[partnerType]] : [];
    const selectedPartnerGroup = this.generatePrnForm.get('partnerGroup').value;
    if (!this.partnerGroupOptions.includes(selectedPartnerGroup)) {
      this.generatePrnForm.patchValue({
        partnerGroup: this.partnerGroupOptions.length ? this.partnerGroupOptions[0] : ''
      });
    }
  }

  loadPartners() {
    // Load list of partners for dropdown
    this.dataService.getPartners().subscribe(
      (response: any) => {
        if (response && response.response && response.response.data) {
          // Extract partner data from the response data array
          this.partners = response.response.data.map((partner: any) => ({
            id: partner.id,
            name: partner.name,
            partnerAuthType: partner.partnerAuthType,
            partnerGroup: partner.partnerGroup
          }));

          // Check if user is not global admin or partner admin
          const roles = this.headerService.getRoleCodes();
          const isAdmin = roles.includes('GLOBAL_ADMIN') || roles.includes('PARTNER_ADMIN');
          
          if (!isAdmin) {
            // For non-admin users, get their partner data and set as default
            const loggedInPartnerId = this.headerService.getPartnerId();
            
            if (loggedInPartnerId) {
              const partnerData = this.partners.find(p => p.id === loggedInPartnerId);
              if (partnerData) {
                // Extract partner type from API response
                const partnerAuthType = partnerData.partnerAuthType || 'ACCESS';
                const partnerGroup = partnerData.partnerGroup || 'PRIVATE';
                
                this.generatePrnForm.patchValue({ 
                  partnerId: loggedInPartnerId,
                  partnerType: partnerAuthType,
                  partnerGroup: partnerGroup
                });
              }
              
              this.isPartnerDropdownDisabled = true;
              this.isPartnerTypeDisabled = true;
              this.isPartnerGroupDisabled = true;
            }
          }
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
    const partnerId = this.generatePrnForm.get('partnerId').value;
    const partnerType = this.generatePrnForm.get('partnerType').value;
    const partnerGroup = this.generatePrnForm.get('partnerGroup').value;
    const numberOfRecords = this.generatePrnForm.get('numberOfRecords').value;

    const request = new RequestModel(
      'mosip.registration.processor.prn.gen.1.0',
      null,
      {
        'partnerId': partnerId,
        'partnerType': partnerType,
        'partnerGroup': partnerGroup,
        'numberOfRecords': Number(numberOfRecords)
      }
    );

    this.dataService.generatePRN(request).subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response && response.response && response.response.prn) {
          this.generatedPRN = response.response.prn;
          this.isSuccess = true;
          this.errorMessage = '';
        } else if (response && response.errors && response.errors.length > 0) {
          this.isSuccess = false;
          const errorMsg = (response && response.errors[0] && response.errors[0].message) 
                          ? response.errors[0].message 
                          : 'PRN generation failed, please try again';
          this.errorMessage = errorMsg;
        } else {
          this.isSuccess = false;
          this.errorMessage = 'PRN generation failed, please try again';
        }
        this.showPRNResult = true;
        
        // this.auditService.audit('ADM-014');
      },
      (error: any) => {
        console.error('Error generating PRN:', error);
        this.isSuccess = false;
        const errorMsg = (error && error.error && error.error.response && error.error.response.message) 
          ? error.error.response.message 
          : 'PRN generation failed, please try again';
        this.errorMessage = errorMsg;
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

    this.generatePrnForm.patchValue({ 
      partnerId: this.isPartnerDropdownDisabled ? this.headerService.getPartnerId() : '',
      partnerType: 'ACCESS',
      partnerGroup: 'PRIVATE',
      numberOfRecords: null
    });
    this.updatePartnerGroupOptions(this.generatePrnForm.get('partnerType').value);
  }
}
