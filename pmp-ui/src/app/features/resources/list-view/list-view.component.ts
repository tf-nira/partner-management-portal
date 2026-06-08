import { Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import * as appConstants from 'src/app/app.constants';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { RequestModel } from 'src/app/core/models/request.model';
import { CenterRequest } from 'src/app/core/models/centerRequest.model';
import { PaginationModel } from 'src/app/core/models/pagination.model';
import { SortModel } from 'src/app/core/models/sort.model';
import { AppConfigService } from 'src/app/app-config.service';
import Utils from 'src/app/app.utils';
import { MatDialog } from '@angular/material';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { AuditService } from 'src/app/core/services/audit.service';
import { HeaderService } from 'src/app/core/services/header.service';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnDestroy {
  headerName: string;
  displayedColumns: any[] = [];
  actionButtons: any[] = [];
  actionEllipsis: any[] = [];
  paginatorOptions: any;
  sortFilter: SortModel[] = [];
  pagination = new PaginationModel();
  centerRequest = {} as CenterRequest;
  requestModel: RequestModel;
  masterData = [];
  mapping: any;
  errorMessages: any;
  subscribed: any;
  noData = false;
  filtersApplied = false;
  masterDataType: string;
  auditEventId: string[];
  labels: any;

  constructor(
    public router: Router,
    public dataStorageService: DataStorageService,
    public appService: AppConfigService,
    public activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    public translateService: TranslateService,
    public auditService: AuditService,
    public headerService: HeaderService
  ) {
    translateService
      .getTranslation(this.headerService.getlanguageCode())
      .subscribe(response => {
        this.labels = response;
        this.errorMessages = response.errorPopup;
      });
    this.subscribed = router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.initializeComponent();
      }
    });
  }

  async initializeComponent() {
    await this.loadData();
    if (this.activatedRoute.snapshot.params.type !== this.masterDataType) {
      this.masterDataType = this.activatedRoute.snapshot.params.type;
      this.auditService.audit(3, this.auditEventId[0], this.masterDataType);
    }
    if (this.masterDataType.toLowerCase() === 'blacklisted-words') {
      await this.loadBlacklistedWords();
    } else {
      await this.getMasterDataTypeValues(
        this.headerService.getlanguageCode()
      );
    }
  }

  loadBlacklistedWords() {
    return new Promise(async (resolve, reject) => {
      const data = [];
      await this.getMasterDataTypeValues('all').then(response => {
        if (response['data']) {
          data.push(...response['data']);
          console.log(response);
        }
      });
      this.masterData = data;
      console.log(this.masterData);
      this.paginatorOptions.totalEntries = this.masterData.length;
      resolve(true);
    });
  }

  loadData() {
    return new Promise((resolve, reject) => {
      const routeParts = this.activatedRoute.snapshot.params.type;
      if (appConstants.masterdataMapping[`${routeParts}`]) {
        this.mapping = appConstants.masterdataMapping[`${routeParts}`];
        this.headerName = appConstants.masterdataMapping[`${routeParts}`].headerName;
      } else {
        this.mapping = {
          apiName: 'partnermanager/partners', specFileName: 'partner', name: 'Auth Partner', nameKey: 'titleName',
          idKey: 'id', headerName: `${routeParts}`
        };
        this.headerName = `${routeParts}`.replace(/_/g, " ");
      }
      this.dataStorageService
        .getSpecFileForMasterDataEntity(this.mapping.specFileName)
        .subscribe(response => {
          console.log(response);
          this.displayedColumns = response.columnsToDisplay.filter(
            values => values.showInListView === 'true'
          );
          console.log(this.displayedColumns.length);
          if (this.applyDefaultSort(routeParts)) {
            return;
          }
          this.actionButtons = response.actionButtons.filter(
            value => value.showIn.toLowerCase() === 'ellipsis'
          );
          console.log(this.actionButtons);
          this.actionEllipsis = response.actionButtons.filter(
            value => value.showIn.toLowerCase() === 'button'
          );
          console.log(this.actionEllipsis);
          this.paginatorOptions = response.paginator;
          console.log(this.paginatorOptions);
          this.auditEventId = response.auditEventIds;
          resolve(true);
          }, error => {
          reject(error);
        });
    });
  }

  applyDefaultSort(routeParts: string) {
    const queryParams = this.activatedRoute.snapshot.queryParams;
    const hasRequestDtimes = this.displayedColumns &&
      this.displayedColumns.some(col => col.name === 'requestDtimes');
    if (!queryParams.sort && hasRequestDtimes) {
      const defaultSort = [
        {
          sortField: 'requestDtimes',
          sortType: 'D'
        }
      ];
      const filters = Utils.convertFilter(
        queryParams,
        this.headerService.getlanguageCode()
      );
      filters.sort = defaultSort;
      const url = Utils.convertFilterToUrl(filters);
      this.router.navigateByUrl(
        `pmp/resources/${routeParts}/view?${url}`
      );
      return true;
    }
    return false;
  }

  getSortColumn(event: SortModel) {
    console.log(event);
    this.sortFilter.forEach(element => {
      if (element.sortField === event.sortField) {
        const index = this.sortFilter.indexOf(element);
        this.sortFilter.splice(index, 1);
      }
    });
    if (event.sortType != null) {
      this.sortFilter.push(event);
    }
    console.log(this.sortFilter);
    const filters = Utils.convertFilter(
      this.activatedRoute.snapshot.queryParams,
      this.headerService.getlanguageCode()
    );
    filters.sort = this.sortFilter;
    const url = Utils.convertFilterToUrl(filters);
    this.router.navigateByUrl(
      `pmp/resources/${this.activatedRoute.snapshot.params.type}/view?${url}`
    );
  }

  pageEvent(event: any) {
    const filters = Utils.convertFilter(
      this.activatedRoute.snapshot.queryParams,
      this.headerService.getlanguageCode()
    );
    filters.pagination.pageFetch = event.pageSize;
    filters.pagination.pageStart = event.pageIndex;
    const url = Utils.convertFilterToUrl(filters);
    this.router.navigateByUrl(
      `pmp/resources/${this.activatedRoute.snapshot.params.type}/view?${url}`
    );
  }

  refreshData() {
    this.getMasterDataTypeValues(this.headerService.getlanguageCode());
  }

  getMasterDataTypeValues(language: string) {
    let self = this;
    return new Promise((resolve, reject) => {
      this.masterData = [];
      this.noData = false;
      this.filtersApplied = false;
      const routeParts = this.activatedRoute.snapshot.params.type;
      const filters = Utils.convertFilter(
        this.activatedRoute.snapshot.queryParams,
        language
      );
      if (filters.filters.length > 0) {
        this.filtersApplied = true;
      }

      // Check if user is non-admin and screen is wallet or payments-search
      const userRoles = this.headerService.getRoleCodes();
      const isAdmin = userRoles && (userRoles.includes('GLOBAL_ADMIN') || userRoles.includes('PARTNER_ADMIN'));
      const isWalletOrPaymentScreen = routeParts === 'wallet' || routeParts === 'payments-search' || routeParts === 'transactions-search';

      // For non-admin users on wallet/payment-search screens, add partnerId filter
      if (!isAdmin && isWalletOrPaymentScreen) {
        let columnNametoFilter = '';
        if (routeParts === 'transactions-search') {
          columnNametoFilter = 'requestedEntityId';
        }
        else {
          columnNametoFilter = 'partnerId';
        }
        const loggedInPartnerId = this.headerService.getPartnerId();
        if (loggedInPartnerId) {
          // Add partnerId filter if not already present
          const partnerIdFilterExists = filters.filters.some(f => f.columnName === columnNametoFilter);
          if (!partnerIdFilterExists) {
            filters.filters.push({
              columnName: columnNametoFilter,
              type: 'equals',
              value: loggedInPartnerId
            });
            this.filtersApplied = true;
          }
        }
      }

      /*this.sortFilter = filters.sort;
      if(this.sortFilter.length == 0){
        if(routeParts != "policymapping"){
          this.sortFilter.push({"sortType":"desc","sortField":"isActive"});
        }else if(routeParts == "policymapping"){
          this.sortFilter.push({"sortType":"desc","sortField":"statusCode"});
        }     
      }*/
      this.requestModel = new RequestModel(null, null, filters);

      if (appConstants.masterdataMapping[`${routeParts}`]) {
        this.mapping = appConstants.masterdataMapping[`${routeParts}`];
        this.headerName = appConstants.masterdataMapping[`${routeParts}`].headerName;
      } else {
        this.mapping = {
          apiName: 'partnermanager/partners', specFileName: 'partner', name: 'Auth Partner', nameKey: 'titleName',
          idKey: 'id', headerName: `${routeParts}`
        };
        this.headerName = "Partner";
        this.requestModel.request["partnerType"] = "all";
      }

      let appConstantsValue = appConstants.navItems;
      appConstantsValue.forEach(element => {
        if (element.children) {
          element.children.forEach(childelement => {
            if (childelement.route.includes(routeParts)) {
              self.headerName = self.labels[childelement.displayName.split('.')[0]][childelement.displayName.split('.')[1]][childelement.displayName.split('.')[2]];
            }
          });
        } else {
          if (element.route.includes(routeParts)) {
            self.headerName = self.labels[element.displayName.split('.')[0]][element.displayName.split('.')[1]][element.displayName.split('.')[2]];
          }
        }
      });

      this.dataStorageService
        .getDataByTypeAndId(this.mapping, this.requestModel)
        .subscribe(({ response }) => {
          if (response != null) {
            this.paginatorOptions.totalEntries = response.totalRecord;
            this.paginatorOptions.pageIndex = filters.pagination.pageStart;
            this.paginatorOptions.pageSize = filters.pagination.pageFetch;
            if (response.data) {
              this.masterData = response.data ? [...response.data] : [];
            } else {
              this.noData = true;
            }
          } else {
            this.noData = true;
            /*this.dialog
              .open(DialogComponent, {
                data: {
                  case: 'MESSAGE',
                  title: this.errorMessages.technicalError.title,
                  message: this.errorMessages.technicalError.message,
                  btnTxt: this.errorMessages.technicalError.btnTxt
                },
                width: '700px'
              })
              .afterClosed()
              .subscribe(result => {
                console.log('dialog is closed from view component');
              });*/
          }
          resolve(response);
        });
    });
  }

  changePage() {
    this.router.navigateByUrl('admin/masterdata/home');
  }

  ngOnDestroy() {
    this.subscribed.unsubscribe();
  }

  exportToCSV() {

  const filtersObj = Utils.convertFilter(
    this.activatedRoute.snapshot.queryParams,
    this.headerService.getlanguageCode()
  );

  const filters = filtersObj.filters || [];

  const betweenFilter = filters.find(
    (f: any) => f.type === 'between'
  );

 
  if (
    !betweenFilter ||
    !betweenFilter.fromValue ||
    !betweenFilter.toValue
  ) {

    this.dialog.open(DialogComponent, {
      width: '400px',
      data: {
        case: 'MESSAGE',
        title: 'Export Validation',
        message: 'Date range filter is mandatory for export',
        btnTxt: 'OK'
      }
    });

    return;
  }

  const fromDate = new Date(betweenFilter.fromValue);
  const toDate = new Date(betweenFilter.toValue);

 
  if (fromDate > toDate) {

    this.dialog.open(DialogComponent, {
      width: '400px',
      data: {
        case: 'MESSAGE',
        title: 'Export Validation',
        message: 'From Date cannot be greater than To Date',
        btnTxt: 'OK'
      }
    });

    return;
  }

  
  const diffTime = Math.abs(
    toDate.getTime() - fromDate.getTime()
  );

  const diffDays = Math.ceil(
    diffTime / (1000 * 60 * 60 * 24)
  );

  if (diffDays > appConstants.EXPORT_MAX_DAYS) {

    this.dialog.open(DialogComponent, {
      width: '400px',
      data: {
        case: 'MESSAGE',
        title: 'Export Validation',
        message: `Date range cannot exceed ${appConstants.EXPORT_MAX_DAYS} days`,
        btnTxt: 'OK'
      }
    });

    return;
  }

 
  const exportRequest = JSON.parse(
    JSON.stringify(filtersObj)
  );

  
  exportRequest.pagination = null;

 
  const request = new RequestModel(
    null,
    null,
    exportRequest
  );

  this.dataStorageService
    .exportAllData(this.mapping, request)
    .subscribe(
      (response: Blob) => {

        const blob = new Blob(
          [response],
          { type: 'text/csv;charset=utf-8;' }
        );

        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);

        link.download =
          `${this.activatedRoute.snapshot.params.type}-export.csv`;

        link.click();

        URL.revokeObjectURL(link.href);
      },
      error => {

        console.log(error);

        this.dialog.open(DialogComponent, {
          width: '400px',
          data: {
            case: 'MESSAGE',
            title: 'Export Failed',
            message: 'Unable to export CSV file',
            btnTxt: 'OK'
          }
        });

      }
    );
}

}
