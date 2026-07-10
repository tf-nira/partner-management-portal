import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { TranslateService } from '@ngx-translate/core';
import { RequestModel } from 'src/app/core/models/request.model';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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
  partnerSearch = new FormControl();
  filteredPartners!: Observable<any[]>;

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
    
    this.generatePrnForm.get('partnerId').valueChanges.subscribe((partnerId: string) => {
      const roles = this.headerService.getRoleCodes();
      const isAdmin = roles.includes('GLOBAL_ADMIN') || roles.includes('PARTNER_ADMIN');

      if (isAdmin) {
        this.onPartnerChange(partnerId);
      }
    });

    this.updatePartnerGroupOptions(this.generatePrnForm.get('partnerType').value);
    // Only subscribe to partnerType changes if it's not disabled
    this.generatePrnForm.get('partnerType').valueChanges.subscribe((selectedPartnerType: string) => {
      if (!this.isPartnerTypeDisabled) {
        this.updatePartnerGroupOptions(selectedPartnerType);
      }
    });
  }

  onPartnerChange(partnerId: string) {
    const selectedPartner = this.partners.find(p => p.id === partnerId);

    if (selectedPartner) {
      // Only patch and disable partnerType if it has a value
      if (selectedPartner.partnerAuthType) {
        this.generatePrnForm.patchValue({ partnerType: selectedPartner.partnerAuthType });
        this.generatePrnForm.get('partnerType').disable();
        this.isPartnerTypeDisabled = true;
      } else {
        this.generatePrnForm.get('partnerType').enable();
        this.isPartnerTypeDisabled = false;
      }

      // Only patch and disable partnerGroup if it has a value
      if (selectedPartner.partnerGroup) {
        this.generatePrnForm.patchValue({ partnerGroup: selectedPartner.partnerGroup });
        this.generatePrnForm.get('partnerGroup').disable();
        this.isPartnerGroupDisabled = true;
      } else {
        this.generatePrnForm.get('partnerGroup').enable();
        this.isPartnerGroupDisabled = false;
      }
    } else {
      // No partner selected, enable fields again
      this.generatePrnForm.get('partnerType').enable();
      this.generatePrnForm.get('partnerGroup').enable();

      this.isPartnerTypeDisabled = false;
      this.isPartnerGroupDisabled = false;
    }
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
          }))
            .sort((a, b) => a.id.localeCompare(b.id));


          this.filteredPartners = this.partnerSearch.valueChanges.pipe(
            startWith(''),
            map(value => {
              const filterValue =
                typeof value === 'string'
                  ? value
                  : value
                    ? value.id
                    : '';

              return this.filterPartners(filterValue);
            })
          );


          // Check if user is not global admin or partner admin
          const roles = this.headerService.getRoleCodes();
          const isAdmin = roles.includes('GLOBAL_ADMIN') || roles.includes('PARTNER_ADMIN');

          if (!isAdmin) {
            // For non-admin users, set partner ID and check header service for auth type and group
            const loggedInPartnerId = this.headerService.getPartnerId();
            if (loggedInPartnerId) {
              this.generatePrnForm.patchValue({
                partnerId: loggedInPartnerId
              });
              const partner = this.partners.find(p => p.id === loggedInPartnerId);

              this.partnerSearch.setValue(partner || null, {
                emitEvent: false
              });
              // Disable the partner dropdown
              this.generatePrnForm.get('partnerId').disable();
              this.isPartnerDropdownDisabled = true;

              // Get partner auth type and group from header service
              const headerPartnerAuthType = this.headerService.getPartnerAuthType();
              const headerPartnerGroup = this.headerService.getPartnerGroup();

              // If values exist in header service, use them and disable fields
              if (headerPartnerAuthType && headerPartnerAuthType.trim()) {
                this.generatePrnForm.patchValue({
                  partnerType: headerPartnerAuthType
                });
                // Disable the partner type field
                this.generatePrnForm.get('partnerType').disable();
                this.isPartnerTypeDisabled = true;
              }

              if (headerPartnerGroup && headerPartnerGroup.trim()) {
                this.generatePrnForm.patchValue({
                  partnerGroup: headerPartnerGroup
                });
                // Disable the partner group field
                this.generatePrnForm.get('partnerGroup').disable();
                this.isPartnerGroupDisabled = true;
              }
            }
          }
        }
      },
      (error: any) => {
        console.error('Error loading partners:', error);
      }
    );
  }

  private filterPartners(value: string): any[] {

    if (!value) {
      return this.partners;
    }

    value = value.toLowerCase();

    return this.partners.filter(partner =>
      partner.id.toLowerCase().includes(value)
    );
  }


  onPartnerSelected(partner: any) {

    this.generatePrnForm.patchValue({
      partnerId: partner.id
    });

    this.onPartnerChange(partner.id);
  }

  displayPartner(partner: any): string {
    return partner ? partner.id : '';
  }


  onAutocompleteClosed() {

    const value = this.partnerSearch.value;

    // User selected a partner object
    if (typeof value === 'object') {
      return;
    }

    const partnerId = this.generatePrnForm.get('partnerId').value;

    const partner = this.partners.find(p => p.id === partnerId);

    this.partnerSearch.setValue(partner || '', {
      emitEvent: false
    });
  }

  onFocus() {
    this.partnerSearch.setValue(this.partnerSearch.value);
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
    this.partnerSearch.reset();

    const resetData: any = {
      numberOfRecords: null
    };

    // Partner
    if (this.isPartnerDropdownDisabled) {
      const partnerId = this.headerService.getPartnerId();

      resetData.partnerId = partnerId;

      this.generatePrnForm.get('partnerId').disable();

      // Restore partner object in autocomplete
      const partner = this.partners.find(p => p.id === partnerId);

      this.partnerSearch.setValue(partner || null, {
        emitEvent: false
      });

    } else {
      resetData.partnerId = '';
      this.generatePrnForm.get('partnerId').enable();
      this.partnerSearch.reset();
    }

    // Partner Type
    if (this.isPartnerTypeDisabled) {
      resetData.partnerType =
        this.headerService.getPartnerAuthType() || 'ACCESS';

      this.generatePrnForm.get('partnerType').disable();

    } else {
      resetData.partnerType = 'ACCESS';
      this.generatePrnForm.get('partnerType').enable();
    }

    // Partner Group
    if (this.isPartnerGroupDisabled) {
      resetData.partnerGroup =
        this.headerService.getPartnerGroup() || 'PRIVATE';

      this.generatePrnForm.get('partnerGroup').disable();

    } else {
      resetData.partnerGroup = 'PRIVATE';
      this.generatePrnForm.get('partnerGroup').enable();
    }

    // Apply values
    this.generatePrnForm.patchValue(resetData);

    // Update partner group options only when editable
    if (!this.isPartnerTypeDisabled) {
      this.updatePartnerGroupOptions(resetData.partnerType);
    }
  }
}
