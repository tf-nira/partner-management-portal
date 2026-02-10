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

  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataStorageService,
    public headerService: HeaderService,
    public auditService: AuditService,
    public translateService: TranslateService
  ) {
    this.validatePrnForm = this.formBuilder.group({
      prn: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response['payments'] || {};
      });
  }

  validatePRN() {
    if (this.validatePrnForm.invalid) {
      return;
    }

    this.isLoading = true;
    const partnerId = this.headerService.getUsername();
    const prn = this.validatePrnForm.get('prn').value;

    const request = new RequestModel(
      '',
      null,
      { 'partnerId': partnerId, 'prn': prn }
    );

    this.dataService.validatePRN(request).subscribe(
      (response: any) => {
        if (response && response.response) {
          this.validationResult = response.response;
          this.isValid = response.response.isValid || false;
          this.showValidationResult = true;
        }
        this.isLoading = false;
        // this.auditService.audit('ADM-015');
      },
      (error: any) => {
        console.error('Error validating PRN:', error);
        this.isValid = false;
        const errorMessage = (error && error.error && error.error.message) ? error.error.message : 'Validation failed';
        this.validationResult = { message: errorMessage };
        this.showValidationResult = true;
        this.isLoading = false;
      }
    );
  }

  closeValidationResult() {
    this.showValidationResult = false;
    this.validationResult = null;
  }
}
