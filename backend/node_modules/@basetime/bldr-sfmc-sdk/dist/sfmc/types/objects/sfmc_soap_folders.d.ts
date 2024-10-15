export interface SFMC_SOAP_Folder {
    Client: {
        ID: number;
        CreatedBy: number;
        ModifiedBy: number;
        EnterpriseID: number;
    };
    PartnerKey: string;
    CreatedDate: string;
    ModifiedDate: string;
    ID: number;
    ObjectID: string;
    CustomerKey: string;
    ParentFolder: {
        PartnerKey: string;
        ID: number;
        ObjectID: string;
        CustomerKey: string;
        Name: string;
        Description: string;
        ContentType: string;
        IsActive: Boolean;
        IsEditable: Boolean;
        AllowChildren: Boolean;
    };
    Name: string;
    Description: string;
    ContentType: string;
    IsActive: Boolean;
    IsEditable: Boolean;
    AllowChildren: Boolean;
    FolderPath?: string | undefined;
    folderPath?: string | undefined;
}
