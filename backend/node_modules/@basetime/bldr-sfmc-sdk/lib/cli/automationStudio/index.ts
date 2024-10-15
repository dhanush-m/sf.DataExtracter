import { Folder } from '../../sfmc/api/Folder';
import { SFMC_SOAP_Folder } from '../../sfmc/types/objects/sfmc_soap_folders';
import { MappingByActivityType } from '../../sfmc/utils/automationActivities';
import { sfmc_context_mapping } from '../../sfmc/utils/sfmcContextMapping';
import { SFMC_Automation } from '../types/bldr_assets/sfmc_automation';
import { SFMC_Client } from '../types/sfmc_client';
import { guid, uniqueArrayByKey } from '../utils';
import { buildFolderPathsSoap } from '../utils/BuildSoapFolderObjects';
import { formatAutomation } from '../utils/_context/automationStudio/FormatAutomationAsset';

export class AutomationStudio {
    sfmc: SFMC_Client;
    contentBuilder: any;
    emailStudio: any;

    constructor(sfmc: SFMC_Client, contentBuilder: any, emailStudio: any) {
        this.sfmc = sfmc;
        this.contentBuilder = contentBuilder;
        this.emailStudio = emailStudio;
    }
    /**
     *
     * @param request.contentType
     * @param request.searchKey
     * @param request.searchTerm
     *
     * ```
     *  {
     *      contentType: '',
     *      searchKey: '',
     *      searchTerm: ''
     *  }
     * ```
     *
     * Output
     * ```
     * [{
     *      Name: string;
     *      ID: number;
     *      CreatedDate: string;
     *      ModifiedDate: string;
     *      ParentFolder: {
     *          Name: string;
     *          ID: string;
     *      }
     *  }]
     * ```
     */
    searchFolders = async (request: {
        contentType: string;
        searchKey: string;
        searchTerm: string;
    }) => {
        const response = await this.sfmc.folder.search(request);
        if (response.OverallStatus !== 'OK') {
            return response.OverallStatus;
        }

        const formattedResponse =
            (response &&
                response.Results &&
                response.Results.length &&
                response.Results.map(
                    (folder: {
                        Name: string;
                        CreatedDate: string;
                        ModifiedDate: string;
                        ID: number;
                        ParentFolder: {
                            Name: string;
                            ID: string;
                        };
                    }) => {
                        return {
                            ID: folder.ID,
                            Name: folder.Name,
                            CreatedDate: folder.CreatedDate,
                            ModifiedDate: folder.ModifiedDate,
                            ParentFolder: {
                                Name: folder.ParentFolder.Name,
                                ID: folder.ParentFolder.ID,
                            },
                        };
                    }
                )) ||
            [];

        return formattedResponse;
    };
    /**
     *
     * @param request.searchKey
     * @param request.searchTerm
     *
     * ```
     *  {
     *      searchKey: '',
     *      searchTerm: ''
     *  }
     * ```
     *
     * Output
     * ```
     * [{
     *      ID: number,
     *      Name: string,
     *      AssetType: string,
     *      CreatedDate: string,
     *      ModifiedDate: string,
     *      Category: {
     *          Name: string,
     *          ParentId: number
     *      }
     *  }]
     * ```
     */
    searchAssets = async (request: {
        searchKey: string;
        searchTerm: string;
    }) => {
        const response = await this.sfmc.automation.searchAutomations(request);
        const formattedResponse =
            (response &&
                response.Results &&
                response.Results.map(
                    (asset: {
                        Name: string;
                        Description: string;
                        ObjectID: string;
                        Status: number;
                        CreatedDate: string;
                        ModifiedDate: string;
                        IsActive: Boolean;
                    }) => {
                        return {
                            ObjectId: asset.ObjectID,
                            Name: asset.Name,
                            Description: asset.Description,
                            Status: asset.Status,
                            CreatedDate: asset.CreatedDate,
                            ModifiedDate: asset.ModifiedDate,
                            IsActive: asset.IsActive,
                        };
                    }
                )) ||
            [];

        return formattedResponse;
    };
    /**
     *
     * @param request.searchKey
     * @param request.searchTerm
     *
     * ```
     *  {
     *      searchKey: '',
     *      searchTerm: ''
     *  }
     * ```
     *
     * Output
     * ```
     * [{
     *      ID: number,
     *      Name: string,
     *      AssetType: string,
     *      CreatedDate: string,
     *      ModifiedDate: string,
     *      Category: {
     *          Name: string,
     *          ParentId: number
     *      }
     *  }]
     * ```
     */
    gatherAssetsByCategoryId = async (request: {
        contentType: string;
        categoryId: number;
    }) => {
        try {
            const folderResponse = await this.sfmc.folder.getFoldersFromMiddle(
                request
            );
            const buildFolderPaths = await buildFolderPathsSoap(
                folderResponse.full
            );

            const formattedFolders = buildFolderPaths.folders.map((folder) => {
                return {
                    id: folder.ID,
                    name: folder.Name,
                    parentId: folder.ParentFolder.ID,
                    folderPath: folder.FolderPath,
                };
            });

            const isolateFolderIds =
                folderResponse &&
                folderResponse.full &&
                folderResponse.full.length &&
                folderResponse.full
                    .map(
                        (folder: SFMC_SOAP_Folder) =>
                            folder.Name !== 'my automations' && folder.ID
                    )
                    .filter(Boolean);

            const collectAutomationKeys =
                await this.sfmc.automation.getAssetsByFolderArray(
                    isolateFolderIds
                );

            const isolateAutomationKeys =
                collectAutomationKeys &&
                collectAutomationKeys.length &&
                collectAutomationKeys.map((asset: { id: string }) => asset.id);

            const assetResponse =
                isolateAutomationKeys &&
                isolateAutomationKeys.length &&
                (await this.sfmc.automation.getAutomationsByKey(
                    isolateAutomationKeys
                ));

            if (
                assetResponse &&
                assetResponse.response &&
                assetResponse.response.status &&
                !assetResponse.response.status.test(/^2/)
            ) {
                throw new Error(assetResponse.response.statusText);
            }

            const formattedAssetResponse =
                assetResponse &&
                assetResponse.length &&
                buildFolderPaths &&
                (await formatAutomation(
                    assetResponse,
                    buildFolderPaths.folders
                ));

            const formattedAutomationDefinitions: any =
                await this.gatherAutomationActivityDefinitions(
                    formattedAssetResponse
                );
            const formattedAutomationDependencies: any =
                formattedAutomationDefinitions &&
                (await this.gatherAutomationActivityDependencies(
                    formattedAutomationDefinitions
                ));

            return {
                folders: formattedFolders || [],
                assets: formattedAssetResponse || [],
                formattedAutomationDefinitions,
                formattedAutomationDependencies,
            };
        } catch (err: any) {
            return err.message;
        }
    };
    /**
     *
     * @param objectId
     */
    gatherAssetById = async (objectId: string) => {
        try {
            if (!objectId) {
                throw new Error('objectId is required');
            }
            const assetResponse = await this.sfmc.automation.getAutomationByKey(
                objectId
            );

            if (
                assetResponse &&
                assetResponse.response &&
                assetResponse.response.status &&
                !assetResponse.response.status.test(/^2/)
            ) {
                throw new Error(assetResponse.response.statusText);
            }

            const categoryId = assetResponse && assetResponse.categoryId;
            const folderResponse =
                await this.sfmc.folder.getParentFoldersRecursive({
                    contentType: 'automations',
                    categoryId,
                });

            const simplifiedFolderResponse =
                (folderResponse.results &&
                    Array.isArray(folderResponse.results) &&
                    folderResponse.results.map((folder: SFMC_SOAP_Folder) => {
                        return {
                            ID: folder.ID,
                            Name: folder.Name,
                            ContentType: folder.ContentType,
                            ParentFolder: {
                                Name:
                                    folder.ParentFolder.Name ||
                                    'my automations',
                                ID: folder.ParentFolder.ID,
                            },
                        };
                    })) ||
                [];

            const buildFolderPaths = await buildFolderPathsSoap(
                simplifiedFolderResponse
            );

            const formattedFolders = buildFolderPaths.folders.map((folder) => {
                return {
                    id: folder.ID,
                    name: folder.Name,
                    parentId: folder.ParentFolder.ID,
                    folderPath: folder.FolderPath,
                };
            });

            const formattedAssetResponse =
                assetResponse &&
                buildFolderPaths &&
                (await formatAutomation(
                    assetResponse,
                    buildFolderPaths.folders
                ));

            const formattedAutomationDefinitions: any =
                await this.gatherAutomationActivityDefinitions(
                    formattedAssetResponse
                );

            const formattedAutomationDependencies: any =
                formattedAutomationDefinitions &&
                (await this.gatherAutomationActivityDependencies(
                    formattedAutomationDefinitions
                ));

            return {
                folders: formattedFolders || [],
                assets: formattedAssetResponse || [],
                formattedAutomationDefinitions,
                formattedAutomationDependencies,
            };
        } catch (err: any) {
            return err.message;
        }
    };
    /**
     *
     * @param automations
     */
    gatherAutomationActivityDefinitions = async (
        automations: SFMC_Automation[] | SFMC_Automation
    ) => {
        try {
            const automationDefinitionOutput: {
                [key: string]: any;
            }[] = [];

            if (Array.isArray(automations)) {
                for (const a in automations) {
                    const automation = automations[a];
                    const automationActivityDefinitions: any[] =
                        await this.sfmc.automation.getAutomationActivities(
                            automation
                        );

                    automationActivityDefinitions &&
                        automationActivityDefinitions.forEach((definition) => {
                            definition.bldrId = guid();
                            automationDefinitionOutput.push(definition);
                        });
                }
            } else {
                const automationActivityDefinitions: any[] =
                    await this.sfmc.automation.getAutomationActivities(
                        automations
                    );
                automationActivityDefinitions &&
                    automationActivityDefinitions.forEach((definition) => {
                        definition.bldrId = guid();
                        automationDefinitionOutput.push(definition);
                    });
            }

            const finalOutput: any[] = [];
            const finalOutputLog: any[] = [];

            for (const a in automationDefinitionOutput) {
                const asset = automationDefinitionOutput[a];
                const objectMapping = await MappingByActivityType(
                    asset.assetType.name
                );
                const objectIdKey = objectMapping && objectMapping.objectIdKey;
                if (
                    objectIdKey &&
                    !finalOutputLog.includes(asset[objectIdKey])
                ) {
                    finalOutputLog.push(asset[objectIdKey]);
                    finalOutput.push(asset);
                }
            }

            return finalOutput;
        } catch (err) {
            console.error(err);
        }
    };

    /**
     *
     * @param automationDefinitions
     */
    gatherAutomationActivityDependencies = async (
        automationDefinitions: any[]
    ) => {
        try {
            const formattedAutomationDependencies: any = {
                automationStudio: [],
                contentBuilder: [],
                emailStudio: [],
            };

            for (const a in automationDefinitions) {
                const definition: any = automationDefinitions[a];
                const assetType =
                    definition &&
                    typeof definition === 'object' &&
                    definition.assetType;

                const assetTypeName = assetType && assetType.name;

                let assetIdKey: string;
                let DECustomerKey: string;
                let findDECustomerKey: any;
                let dataExtensionAssetResponse;
                let dataExtensionAssetResponseStatus;
                let customerKeyArr: string[] = [];
                switch (assetTypeName) {
                    case 'userinitiatedsend':
                        const legacyId =
                            definition &&
                            definition.Email &&
                            definition.Email.ID;

                        const emailAssetResponse =
                            legacyId &&
                            (await this.contentBuilder.gatherAssetById(
                                legacyId,
                                true
                            ));

                        emailAssetResponse &&
                            emailAssetResponse.assets &&
                            formattedAutomationDependencies &&
                            typeof formattedAutomationDependencies ===
                                'object' &&
                            Object.prototype.hasOwnProperty.call(
                                formattedAutomationDependencies,
                                'contentBuilder'
                            ) &&
                            formattedAutomationDependencies?.contentBuilder &&
                            Array.isArray(
                                formattedAutomationDependencies.contentBuilder
                            ) &&
                            formattedAutomationDependencies.contentBuilder.push(
                                emailAssetResponse
                            );
                    case 'dataextractactivity':
                    case 'importactivity':
                    case 'userinitiatedsend':
                    case 'queryactivity':
                        if (assetTypeName === 'dataextractactivity') {
                            findDECustomerKey = definition.dataFields.find(
                                (dataField: {
                                    name: string;
                                    type: string;
                                    value: string;
                                }) => dataField.name === 'DECustomerKey'
                            );

                            findDECustomerKey &&
                                findDECustomerKey.value &&
                                customerKeyArr.push(findDECustomerKey.value);
                        } else if (assetTypeName === 'importactivity') {
                            findDECustomerKey =
                                await this.emailStudio.searchDataExtensions({
                                    searchKey: 'ObjectID',
                                    searchTerm: definition.destinationObjectId,
                                });

                            findDECustomerKey &&
                                Array.isArray(findDECustomerKey) &&
                                findDECustomerKey.length === 1 &&
                                findDECustomerKey[0].CustomerKey &&
                                customerKeyArr.push(
                                    findDECustomerKey[0].CustomerKey
                                );
                        } else if (assetTypeName === 'queryactivity') {
                            definition &&
                                definition.targetKey &&
                                customerKeyArr.push(definition.targetKey);
                        } else if (assetTypeName === 'userinitiatedsend') {
                            const sendDefinitionList =
                                (definition && definition.SendDefinitionList) ||
                                [];
                            const sendDefinitionListIDs =
                                sendDefinitionList &&
                                sendDefinitionList.length &&
                                (await Promise.all(
                                    sendDefinitionList.map(
                                        async (sendDefinitionObject: {
                                            PartnerKey: string;
                                            ObjectID: string;
                                            SendDefinitionListType: string;
                                            CustomObjectID: string;
                                            DataSourceTypeID: string;
                                            IsTestObject: boolean;
                                            SalesForceObjectID: string;
                                            Name: string;
                                        }) => {
                                            findDECustomerKey =
                                                await this.emailStudio.searchDataExtensions(
                                                    {
                                                        searchKey: 'ObjectID',
                                                        searchTerm:
                                                            sendDefinitionObject.CustomObjectID,
                                                    }
                                                );

                                            return (
                                                findDECustomerKey &&
                                                Array.isArray(
                                                    findDECustomerKey
                                                ) &&
                                                findDECustomerKey.length ===
                                                    1 &&
                                                findDECustomerKey[0].CustomerKey
                                            );
                                        }
                                    )
                                ));

                            sendDefinitionListIDs &&
                                sendDefinitionListIDs.length &&
                                customerKeyArr.push(...sendDefinitionListIDs);
                        }

                        for (const d in customerKeyArr) {
                            const customerKey = customerKeyArr[d];

                            let dataExtensionAssetResponse =
                                await this.emailStudio.gatherAssetById(
                                    customerKey,
                                    true
                                );

                            dataExtensionAssetResponseStatus =
                                dataExtensionAssetResponse &&
                                dataExtensionAssetResponse.status;

                            if (
                                dataExtensionAssetResponseStatus &&
                                dataExtensionAssetResponseStatus === 'error'
                            ) {
                                dataExtensionAssetResponse =
                                    await this.emailStudio.gatherAssetById(
                                        customerKey,
                                        true,
                                        true
                                    );
                            }

                            formattedAutomationDependencies.emailStudio.push(
                                dataExtensionAssetResponse
                            );
                        }

                        break;
                }
            }

            const finalOutput: {
                [key: string]: any;
            } = {};

            for (const a in formattedAutomationDependencies) {
                const context = a;
                const contextDependencies =
                    formattedAutomationDependencies[context];

                let assetIdKey: string | null = ['contentBuilder'].includes(
                    context
                )
                    ? 'id'
                    : ['emailStudio'].includes(context)
                    ? 'objectId'
                    : null;

                const folders = contextDependencies
                    .map((dep: { folders: Folder }) => dep.folders)
                    .filter(Boolean);

                const assets = contextDependencies
                    .map((dep: { assets: any }) => dep.assets)
                    .filter(Boolean);

                const uniqueAssets =
                    assetIdKey &&
                    (await uniqueArrayByKey(assets.flat(), assetIdKey));

                const uniqueFolders = await uniqueArrayByKey(
                    folders.flat(),
                    'id'
                );

                finalOutput[context] = {
                    folders: uniqueFolders || [],
                    assets: uniqueAssets || [],
                };
            }

            return finalOutput || {};
        } catch (err: any) {
            return err;
        }
    };

    /**
     * Method to search Automation Studio Activity Endpoint
     *
     * @param {string} searchActivity Endpoint property to search
     * @param {string} searchTerm of asset to search for
     */
    searchActivity = async (searchActivity: string, searchTerm: string) => {
        try {
            let activity: string = '';
            switch (searchActivity) {
                case 'ssjs':
                    activity = 'scripts';
                    break;
                case 'sql':
                    activity = 'queries';
                    break;
            }

            const resp = await this.sfmc.automation.searchActivity(
                activity,
                searchTerm
            );

            if (
                Object.prototype.hasOwnProperty.call(resp, 'items') &&
                resp.items.length === 0
            ) {
                throw new Error(`No Search Items Returned for ${searchTerm}`);
            }

            return (
                (resp &&
                    resp.items &&
                    resp.items.length &&
                    resp.items.map((result: any) => {
                        let objectKey: string = '';
                        switch (searchActivity) {
                            case 'ssjs':
                                objectKey = 'ssjsActivityId';
                                break;
                            case 'sql':
                                objectKey = 'queryDefinitionId';
                                break;
                        }

                        return {
                            Name: result.name,
                            [objectKey]: result[objectKey],
                            CategoryID: result.categoryId,
                            ModifiedDate: result.modifiedDate,
                        };
                    })) ||
                []
            );
        } catch (err: any) {
            return err;
        }
    };

    gatherAutomationDefinitionsByCategoryId = async (
        request: {
            contentType: string;
            categoryId: number;
        },
        removeRoot = false
    ) => {
        const folderResponse = await this.sfmc.folder.getFoldersFromMiddle(
            request
        );

        const buildFolderPaths = await buildFolderPathsSoap(folderResponse);

        const rootFolderObj = sfmc_context_mapping.find(
            (ctxFolder) => ctxFolder.contentType === request.contentType
        );
        const rootFolder = rootFolderObj && rootFolderObj.name;
        const definitionApi = rootFolderObj && rootFolderObj.api;

        const rootFolderResponse = await this.sfmc.folder.search({
            contentType: request.contentType,
            searchKey: 'Name',
            searchTerm: rootFolder,
        });

        const rootFolderID =
            (rootFolderResponse.OverallStatus === 'OK' &&
                rootFolderResponse.Results &&
                rootFolderResponse.Results[0] &&
                rootFolderResponse.Results[0].ID) ||
            null;

        const isolateFolderIds: any[] =
            rootFolderID && rootFolderID !== request.categoryId
                ? (buildFolderPaths &&
                      buildFolderPaths.folders &&
                      buildFolderPaths.folders.length &&
                      buildFolderPaths.folders
                          .map(
                              (folder: SFMC_SOAP_Folder) =>
                                  rootFolderID !== folder.ID && folder.ID
                          )
                          .filter(Boolean)) ||
                  []
                : (buildFolderPaths &&
                      buildFolderPaths.folders &&
                      buildFolderPaths.folders.length &&
                      buildFolderPaths.folders.map(
                          (folder: SFMC_SOAP_Folder) => folder.ID
                      )) ||
                  [];

        const definitionReturn: any[] = [];
        for (const i in isolateFolderIds) {
            const definitionRequest =
                await this.sfmc.automation.searchActivityByCategoryId({
                    searchActivity: definitionApi,
                    categoryId: isolateFolderIds[i],
                });

            definitionReturn.push(...definitionRequest.items);
        }

        return {
            assets: definitionReturn || [],
            folders: buildFolderPaths.folders,
        };
    };

    gatherAutomationDefinitionsById = async (request: {
        contentType: string;
        assetId: number;
    }) => {
        const rootFolderObj = sfmc_context_mapping.find(
            (ctxFolder) => ctxFolder.contentType === request.contentType
        );
        const rootFolder = rootFolderObj && rootFolderObj.name;
        const definitionApi = rootFolderObj && rootFolderObj.api;

        const definitionRequest =
            await this.sfmc.automation.getAutomationActivity({
                activityType: definitionApi,
                activityObjectId: request.assetId,
            });

        const folderResponse =
            definitionRequest &&
            (await this.sfmc.folder.getFoldersFromMiddle({
                contentType: request.contentType,
                categoryId: definitionRequest.categoryId,
            }));

        const buildFolderPaths = await buildFolderPathsSoap(
            folderResponse.full
        );

        return {
            assets: Array.isArray(definitionRequest)
                ? definitionRequest
                : new Array(definitionRequest) || [],
            folders: buildFolderPaths.folders,
        };
    };
}
