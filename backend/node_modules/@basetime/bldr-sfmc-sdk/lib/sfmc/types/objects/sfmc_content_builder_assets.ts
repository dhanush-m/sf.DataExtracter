export interface SFMC_Content_Builder_Asset {
    id: number;
    customerKey: string;
    objectID: string;
    assetType: {
        id: number;
        name: string;
        displayName: string;
    };
    name: string;
    owner: {
        id: number;
        email: string;
        name: string;
        userId: number;
    };
    createdDate: string;
    createdBy: {
        id: number;
        email: string;
        name: string;
        userId: number;
    };
    modifiedDate: string;
    modifiedBy: {
        id: number;
        email: string;
        name: string;
        userId: number;
    };
    enterpriseId: number;
    memberId: number;
    status: {
        id: number;
        name: string;
    };
    thumbnail?: {
        thumbnailUrl: string;
    };
    category: {
        id: number;
        name: string;
        parentId: number;
        folderPath: string;
    };
    views?: {
        html: {
            content: string;
        };
    };
    content?: string;
    meta?: object;
    slots?: object;
    availableViews?: object[];
    modelVersion?: number;
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
