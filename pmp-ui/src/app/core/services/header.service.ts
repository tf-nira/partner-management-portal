import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  public Username = '';
  public roles = 'ZONAL_ADMIN,GLOBAL_ADMIN,';
  public zone = '';
  public languageCode = '';
  public emailId = '';
  public organizationName = '';
  public address = '';
  public contactNumber = '';
  public partnerType = '';
  public notificationLanguage = '';
  public partnerId = '';
  public partnerName = '';
  public partnerAuthType = '';
  public partnerGroup = '';

  constructor() { }

  setOrganizationName(organizationName: string) {
    this.organizationName = organizationName;
  }

  getOrganizationName(): string {
    return this.organizationName;
  }

  setAddress(address: string) {
    this.address = address;
  }

  getAddress(): string {
    return this.address;
  }

  setContactNumber(contactNumber: string) {
    this.contactNumber = contactNumber;
  }

  getContactNumber(): string {
    return this.contactNumber;
  }

  setPartnerType(partnerType: string) {
    this.partnerType = partnerType;
  }

  getPartnerType(): string {
    return this.partnerType;
  }

  setUsername(username: string) {
    this.Username = username;
  }

  getUsername(): string {
    return this.Username;
  }

  setRoles(roles: string) {
    this.roles = roles;
    console.log('HeaderService - setRoles called with:', roles);
  }

  getRoles(): string {
    const x = this.roles.split(',');
    x.splice(x.length - 1, 1);
    return x.join(', ').replace(/_/g, ' ');
  }

  getRoleCodes(): string {
    // Filter out empty strings from role string (in case of trailing commas)
    const roleArray = this.roles.split(',').filter(role => role.trim() !== '');
    const cleanRoles = roleArray.join(',');
    console.log('HeaderService - getRoleCodes:', {
      raw: this.roles,
      split: roleArray,
      clean: cleanRoles
    });
    return cleanRoles;
  }

  setNotificationLanguage(notificationLanguage: string) {
    this.notificationLanguage = notificationLanguage;
  }

  getNotificationLanguage() {
    return this.notificationLanguage;
  }

  setZone(zone: string) {
    this.zone = zone;
  }

  getZone(): string {
    return this.zone;
  }

  setEmailId(emailId: string) {
    this.emailId = emailId;
  }

  getEmailId(): string {
    return this.emailId;
  }

  setlanguageCode(languageCode: string) {
    this.languageCode = languageCode;
  }

  getlanguageCode(): string {
    if(this.languageCode){
      return this.languageCode;
    }else{
      return "eng";
    }
  }

  setPartnerId(partnerId: string) {
    this.partnerId = partnerId;
  }

  getPartnerId(): string {
    return this.partnerId;
  }

  setPartnerName(partnerName: string) {
    this.partnerName = partnerName;
  }

  getPartnerName(): string {
    return this.partnerName;
  }

  setPartnerAuthType(partnerAuthType: string) {
    this.partnerAuthType = partnerAuthType;
  }

  getPartnerAuthType(): string {
    return this.partnerAuthType;
  }

  setPartnerGroup(partnerGroup: string) {
    this.partnerGroup = partnerGroup;
  }

  getPartnerGroup(): string {
    return this.partnerGroup;
  }
}
