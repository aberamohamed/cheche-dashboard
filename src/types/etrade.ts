export type EtradeAssociateInfo = {
  Position: string | null;
  ManagerName: string | null;
  ManagerNameEng: string | null;
  Photo: string | null;
  MobilePhone: string | null;
  RegularPhone: string | null;
};

export type EtradeBusinessSector = {
  Code: number;
  Description: string | null;
};

export type EtradeBusinessEntry = {
  MainGuid?: string | null;
  OwnerTIN?: string | null;
  DateRegistered?: string | null;
  TradeNameAmh?: string | null;
  TradesName?: string | null;
  LicenceNumber?: string | null;
  RenewalDate?: string | null;
  RenewedFrom?: string | null;
  RenewedTo?: string | null;
  BusinessLicensingGroupMain?: string | null;
  SubGroups?: EtradeBusinessSector[];
};

export type EtradeRegistrationInfo = {
  Tin: string;
  LicenseNo?: string | null;
  LegalCondtion: string | null;
  RegNo: string | null;
  RegDate: string | null;
  BusinessName: string | null;
  BusinessNameAmh: string | null;
  PaidUpCapital: number | null;
  AssociateShortInfos: EtradeAssociateInfo[];
  Businesses: EtradeBusinessEntry[];
};

export type EtradeAddressInfo = {
  Region: string | null;
  Zone: string | null;
  Woreda: string | null;
  Kebele: string | null;
  HouseNo: string | null;
  MobilePhone: string | null;
  RegularPhone: string | null;
};

export type EtradeBusinessByLicenseDetail = {
  MainGuid: string | null;
  OwnerTIN: string | null;
  DateRegistered: string | null;
  TradeName: string | null;
  LicenceNumber: string | null;
  Status: number | null;
  StatusDescription: string | null;
  Capital: number | null;
  AssociateShortInfos: EtradeAssociateInfo[];
  AddressInfo: EtradeAddressInfo | null;
  SubGroups: EtradeBusinessSector[];
  RenewedTo: string | null;
  RenewedToDateString: string | null;
  RenewalDate: string | null;
  RenewedFrom: string | null;
  CancellationDate: string | null;
};
