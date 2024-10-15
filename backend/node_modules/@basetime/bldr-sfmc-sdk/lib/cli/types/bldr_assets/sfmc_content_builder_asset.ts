export interface BLDR_SFMC_Content_Builder_Asset {
    id: number;
    bldrId: string;
    name: string;
    customerKey: string;
    assetType: {
        id: number;
        name: string;
        displayName: string;
    };
    category: {
        id: number;
        name: string;
        parentId: number;
        folderPath?: string;
    };
    content?: string;
    meta?: any;
    slots?: any;
    views?: any;
    businessUnitAvailability?: {
        [key: string]: any;
    };
    sharingProperties?: {
        [key: string]: any;
    };
    legacyData?: {
        [key: string]: any;
    };
}
