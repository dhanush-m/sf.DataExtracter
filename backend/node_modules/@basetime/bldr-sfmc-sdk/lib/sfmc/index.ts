//TODO Separate out SFMC functions into its own package
//TODO Explore possibility of sfmc-sdk to allow oAuth token
const SDK = require('sfmc-sdk');

// Class Imports
import { Account } from '../sfmc/api/Account';
import { Automation } from '../sfmc/api/Automation';
import { ContentBuilderAsset } from '../sfmc/api/ContentBuilderAssets';
import { Folder } from '../sfmc/api/Folder';
import { sfmc_context_mapping } from './utils/sfmcContextMapping';

// Type Definition Imports
import { SFMC_Client } from '../cli/types/sfmc_client';
import { EmailStudio } from './api/EmailStudio';
import { AuthObject } from './types/sfmc_auth_object';

/**
 * Creates an instance of BLDR SDK.
 *
 * @param {object} AuthObject Auth Object for making requests
 */
export class SFMC implements SFMC_Client {
    client: any;
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
    account: {
        getInstanceDetails: Function;
        getBusinessUnitDetails: Function;
        getAllBusinessUnitDetails: Function;
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
        postAsset: Function;
        searchActivity: Function;
        searchActivityByCategoryId: Function;
    };
    emailStudio: {
        searchEmailSendDefinition: Function;
        getEmailSendDefinitionActivity: Function;
        getAssetsByFolderArray: Function;
        searchDataExtensionByName: Function;
        retrieveDataExtensionPayloadByName: Function;
        retrieveDataExtensionPayloadByCustomerKey: Function;
        getDataExtensionFields: Function;
        postAsset: Function;
    };
    constructor(AuthObject: AuthObject) {
        this.client = new SDK(AuthObject, {
            eventHandlers: {
                // onLoop: (type, accumulator) => console.log('Looping', type, accumlator.length),
                // onRefresh: (options) => console.log('RefreshingToken.', Options),
                logRequest: (req: any) =>
                    process.env.NODE_ENV === 'development'
                        ? console.log(req)
                        : null,
                logResponse: (res: any) =>
                    process.env.NODE_ENV === 'development'
                        ? console.log(res)
                        : null,
                onConnectionError: (ex: any, remainingAttempts: number) =>
                    process.env.NODE_ENV === 'development'
                        ? console.log(ex.code, remainingAttempts)
                        : null,
            },
            requestAttempts: 1,
            retryOnConnectionError: true,
        });

        this.folder = new Folder(this.client, sfmc_context_mapping);
        this.asset = new ContentBuilderAsset(this.client);
        this.account = new Account(this.client);
        this.automation = new Automation(this.client);
        this.emailStudio = new EmailStudio(this.client, this.folder);
        // this.describe = new Describe(this.client.soap);
        // this.dataExtension = new DataExtension(this.client.soap);
        // this.query = new QueryDefinition(this.client.rest, this.client.soap);
    }
}
