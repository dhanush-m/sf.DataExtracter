import { SFMC_SOAP_Folder } from '../../sfmc/types/objects/sfmc_soap_folders';
import { SFMC_Client } from '../types/sfmc_client';
import { buildFolderPathsSoap } from '../utils/BuildSoapFolderObjects';

export class EmailStudio {
    sfmc: SFMC_Client;

    constructor(sfmc: SFMC_Client) {
        this.sfmc = sfmc;
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
    searchDataExtensions = async (request: {
        searchKey: string;
        searchTerm: string;
    }) => {
        const response = await this.sfmc.emailStudio.searchDataExtensionByName(
            request
        );
        if (response.OverallStatus !== 'OK') {
            return response.OverallStatus;
        }

        const formattedResponse =
            (response &&
                response.Results &&
                response.Results.length &&
                response.Results.map(
                    (dataExtension: {
                        Name: string;
                        CreatedDate: string;
                        ModifiedDate: string;
                        CustomerKey: string;
                        CategoryID: number;
                    }) => {
                        return {
                            CustomerKey: dataExtension.CustomerKey,
                            Name: dataExtension.Name,
                            CreatedDate: dataExtension.CreatedDate,
                            ModifiedDate: dataExtension.ModifiedDate,
                            CategoryID: dataExtension.CategoryID,
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
    gatherAssetsByCategoryId = async (
        request: {
            contentType: string;
            categoryId: number;
        },
        complete = false
    ) => {
        try {
            const shared =
                request.contentType === 'shared_dataextension' ? true : false;

            const rootParentName = shared
                ? 'Shared Data Extensions'
                : 'Data Extensions';

            const folderResponse = await this.sfmc.folder.getFoldersFromMiddle(
                request
            );

            const isolateFolderIds =
                (folderResponse &&
                    folderResponse.full &&
                    folderResponse.full.length &&
                    folderResponse.full
                        .map(
                            (folder: SFMC_SOAP_Folder) =>
                                folder.Name !== rootParentName && folder.ID
                        )
                        .filter(Boolean)) ||
                [];

            const assetsAndFoldersRequest = await Promise.all([
                buildFolderPathsSoap(folderResponse.full),
                this.sfmc.emailStudio.getAssetsByFolderArray(isolateFolderIds),
            ]);

            const buildFolderPaths =
                (assetsAndFoldersRequest && assetsAndFoldersRequest[0]) || [];
            const assetResponse =
                (assetsAndFoldersRequest && assetsAndFoldersRequest[1]) || [];

            let dataExtensionsResults =
                assetResponse &&
                assetResponse.Results &&
                assetResponse.Results.length
                    ? assetResponse.Results
                    : [];

            let formattedAssets;
            if (dataExtensionsResults && dataExtensionsResults.length) {
                dataExtensionsResults = dataExtensionsResults.filter(Boolean);
                formattedAssets =
                    (await Promise.all(
                        dataExtensionsResults.map(
                            (dataExtension: { Name: String }) => {
                                if (!dataExtension.Name) return;

                                return (
                                    this.sfmc.emailStudio.retrieveDataExtensionPayloadByName(
                                        dataExtension.Name,
                                        complete,
                                        shared
                                    ) || null
                                );
                            }
                        )
                    )) || [];
            }

            const formattedFolders =
                (buildFolderPaths.folders &&
                    buildFolderPaths.folders.length &&
                    buildFolderPaths.folders.map((folder: SFMC_SOAP_Folder) => {
                        return {
                            id: folder.ID,
                            name: folder.Name,
                            parentId: folder.ParentFolder.ID,
                            folderPath: folder.FolderPath,
                        };
                    })) ||
                [];

            return {
                folders: formattedFolders || [],
                assets: formattedAssets || [],
            };
        } catch (err: any) {
            return err;
        }
    };
    /**
     *
     * @param assetId
     */
    gatherAssetById = async (
        customerKey: string,
        complete = false,
        shared = false
    ) => {
        try {
            if (!customerKey) {
                throw new Error('customerKey is required');
            }

            // Accounts for LegacyIds and Content Builder AssetIds
            let dataExtensionPayload =
                await this.sfmc.emailStudio.retrieveDataExtensionPayloadByCustomerKey(
                    customerKey,
                    complete,
                    shared
                );

            if (!dataExtensionPayload) {
                throw new Error('Data Extension Not Found');
            }
            const categoryId =
                dataExtensionPayload &&
                dataExtensionPayload.category.categoryId;

            const dataExtensionFolderObject = await this.sfmc.folder.getFolder({
                contentType: shared ? 'shared_dataextension' : 'dataextension',
                categoryId,
            });

            if (
                dataExtensionFolderObject &&
                !dataExtensionFolderObject.Results
            ) {
                throw new Error('No Folders Found');
            }

            let parentFolders =
                await this.sfmc.folder.getParentFoldersRecursive({
                    contentType: shared
                        ? 'shared_dataextension'
                        : 'dataextension',
                    categoryId,
                });

            const buildFolderPaths = await buildFolderPathsSoap([
                ...parentFolders.results,
                ...dataExtensionFolderObject.Results,
            ]);

            const formattedFolders =
                (buildFolderPaths &&
                    buildFolderPaths.folders &&
                    buildFolderPaths.folders.length &&
                    buildFolderPaths.folders.map((folder) => {
                        return {
                            id: folder.ID,
                            name: folder.Name,
                            parentId: folder.ParentFolder.ID,
                            folderPath: folder.FolderPath,
                        };
                    })) ||
                [];

            return {
                folders: formattedFolders,
                assets: [dataExtensionPayload] || [],
            };
        } catch (err: any) {
            return {
                status: 'error',
                statusMessage: err.message || err,
            };
        }
    };
}
