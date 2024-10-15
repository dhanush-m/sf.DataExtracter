export interface SFMC_Client {
    client: any;
    account: {
        getInstanceDetails: Function;
        getBusinessUnitDetails: Function;
        getAllBusinessUnitDetails: Function;
    };
    folder: {
        search: Function;
        getFolder: Function;
        getSubfolders: Function;
        getParentFoldersRecursive: Function;
        getSubfoldersRecursive: Function;
        getFoldersFromMiddle: Function;
        createFolder: Function;
        _updateAllowChildren: Function;
    };
    asset: {
        getByAssetId: Function;
        getAssetByLegacyId: Function;
        getAssetsByFolderArray: Function;
        getAssetByNameAndFolder: Function;
        searchAssets: Function;
        postAsset: Function;
        putAsset: Function;
        deleteAsset: Function;
        getImageData: Function;
    };
    automation: {
        searchAutomations: Function;
        getAutomationByKey: Function;
        getAutomationsByKey: Function;
        getAssetsByFolderArray: Function;
        getAutomationActivity: Function;
        getAutomationActivities: Function;
        patchAutomationAsset: Function;
        searchActivity: Function;
        searchActivityByCategoryId: Function;
    };
    emailStudio: {
        searchEmailSendDefinition: Function;
        getEmailSendDefinitionActivity: Function;
        getAssetsByFolderArray: Function;
        retrieveDataExtensionPayloadByName: Function;
        retrieveDataExtensionPayloadByCustomerKey: Function;
        searchDataExtensionByName: Function;
        postAsset: Function;
    };
}
