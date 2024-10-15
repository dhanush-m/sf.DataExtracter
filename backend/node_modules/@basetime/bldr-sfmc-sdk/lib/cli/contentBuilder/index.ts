import { SFMC_SOAP_Folder } from '../../sfmc/types/objects/sfmc_soap_folders';
import { SFMC_Client } from '../types/sfmc_client';
import { buildFolderPathsSoap } from '../utils/BuildSoapFolderObjects';
import { formatContentBuilderAssets } from '../utils/_context/contentBuilder/FormatContentBuilderAsset';
import { getContentBuilderAssetContent } from '../utils/_context/contentBuilder/GetContentBuilderAssetContent';
import {
    getAssetDependency,
    setUpdatedPackageAssetContent,
} from '../utils/_context/contentBuilder/GetContentBuilderAssetDependencies';
import { contentBuilderPackageReference } from '../utils/_context/contentBuilder/PackageReference';

export class ContentBuilder {
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
        try {
            const response = await this.sfmc.asset.searchAssets(request);

            const formattedResponse =
                (response &&
                    response.items &&
                    response.items.length &&
                    response.items.map(
                        (asset: {
                            id: number;
                            name: string;
                            assetType: {
                                name: string;
                                displayName: string;
                            };
                            createdDate: string;
                            modifiedDate: string;
                            category: {
                                name: string;
                                parentId: number;
                            };
                            sharingProperties?: any;
                            fileProperties?: {
                                publishedURL?: string;
                                extension?: string;
                            };
                        }) => {
                            let assetOutput: {
                                sharingProperties?: any;
                                ID: number;
                                Name: string;
                                AssetType: string;
                                CreatedDate: string;
                                ModifiedDate: string;
                                Category: {
                                    Name: string;
                                    ParentId: number;
                                };
                                PublishedURL?: string;
                                ImageType?: string;
                            } = {
                                ID: asset.id,
                                Name: asset.name,
                                AssetType: asset.assetType.name,
                                CreatedDate: asset.createdDate,
                                ModifiedDate: asset.modifiedDate,
                                Category: {
                                    Name: asset.category.name,
                                    ParentId: asset.category.parentId,
                                },
                            };

                            if (asset?.assetType?.displayName === 'Image') {
                                assetOutput.PublishedURL =
                                    asset?.fileProperties?.publishedURL;
                                assetOutput.ImageType =
                                    asset?.fileProperties?.extension;
                            }

                            if (
                                Object.prototype.hasOwnProperty.call(
                                    asset,
                                    'sharingProperties'
                                )
                            ) {
                                assetOutput.sharingProperties =
                                    asset.sharingProperties;
                            }

                            return assetOutput;
                        }
                    )) ||
                [];

            return formattedResponse;
        } catch (err) {
            return err;
        }
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
        shared = false
    ) => {
        try {
            if (!request.contentType) {
                throw new Error('contentType required');
            }
            if (!request.categoryId) {
                throw new Error('categoryId required');
            }

            const rootFolderName = shared
                ? 'Shared Content'
                : 'Content Builder';

            const folderResponse = await this.sfmc.folder.getFoldersFromMiddle({
                contentType: shared ? 'asset-shared' : 'asset',
                categoryId: request.categoryId,
            });

            const isolateFolderIds =
                folderResponse &&
                folderResponse.full &&
                folderResponse.full.length &&
                folderResponse.full
                    .map(
                        (folder: SFMC_SOAP_Folder) =>
                            folder.Name !== rootFolderName && folder.ID
                    )
                    .filter(Boolean);

            const assetsAndFoldersRequest = await Promise.all([
                buildFolderPathsSoap(folderResponse.full),
                this.sfmc.asset.getAssetsByFolderArray(isolateFolderIds),
            ]);

            const buildFolderPaths =
                (assetsAndFoldersRequest && assetsAndFoldersRequest[0]) || [];
            const assetResponse =
                (assetsAndFoldersRequest && assetsAndFoldersRequest[1]) || [];

            if (
                assetResponse &&
                assetResponse.response &&
                assetResponse.response.status &&
                !/^2/.test(assetResponse.response.status.toString())
            ) {
                if (
                    assetResponse.response &&
                    assetResponse.response.data &&
                    assetResponse.response.data.message
                ) {
                    throw new Error(assetResponse.response.data.message);
                } else {
                    throw new Error(
                        'There is an issue with the request. Check privileges and try again.'
                    );
                }
            }

            const formatResponses = await Promise.all([
                formatContentBuilderAssets(
                    assetResponse.items,
                    buildFolderPaths.folders
                ),
                buildFolderPaths.folders.map((folder) => {
                    return {
                        id: folder.ID,
                        name: folder.Name,
                        parentId: folder.ParentFolder.ID,
                        folderPath: folder.FolderPath,
                    };
                }),
            ]);

            const formattedAssetResponse =
                (formatResponses && formatResponses[0]) || [];
            const formattedFolders =
                (formatResponses && formatResponses[1]) || [];

            return {
                folders: formattedFolders || [],
                assets: formattedAssetResponse || [],
                rawAssets: assetResponse.items || [],
            };
        } catch (err: any) {
            return {
                status: 'error',
                statusMessage: err.message,
            };
        }
    };
    /**
     *
     * @param assetId
     */
    gatherAssetById = async (
        assetId: number,
        legacy: Boolean = false,
        shared = false
    ) => {
        try {
            if (!assetId) {
                throw new Error('assetId is required');
            }

            // Accounts for LegacyIds and Content Builder AssetIds
            let assetResponse =
                (legacy &&
                    (await this.sfmc.asset.getAssetByLegacyId(assetId))) ||
                (await this.sfmc.asset.getByAssetId(assetId));

            assetResponse =
                (legacy &&
                    assetResponse &&
                    assetResponse.items &&
                    assetResponse.items.length &&
                    assetResponse.items[0]) ||
                assetResponse;

            if (assetResponse && !assetResponse.id) {
                throw new Error(assetResponse);
            }

            const categoryId =
                assetResponse &&
                assetResponse.category &&
                assetResponse.category.id;

            const folderResponse = await this.sfmc.folder.getFoldersFromMiddle({
                contentType: shared ? 'asset-shared' : 'asset',
                categoryId,
            });

            const buildFolderPaths = await buildFolderPathsSoap(
                folderResponse.full
            );

            let formattedAssetResponse =
                (assetResponse &&
                    buildFolderPaths &&
                    buildFolderPaths.folders &&
                    (await formatContentBuilderAssets(
                        assetResponse,
                        buildFolderPaths.folders
                    ))) ||
                [];

            const formattedFolders =
                (buildFolderPaths.folders &&
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
                folders: formattedFolders || [],
                assets: formattedAssetResponse || [],
            };
        } catch (err: any) {
            return err;
        }
    };

    /**
     *
     * @param asset
     * @param content
     * @returns
     */
    updateContentBuilderAssetContent = (asset: any, content: string) => {
        const assetType = (asset.assetType && asset.assetType.name) || null;

        switch (assetType) {
            case 'webpage':
            case 'htmlemail':
                asset.views.html.content = content;
                break;
            case 'codesnippetblock':
            case 'htmlblock':
            case 'jscoderesource':
                asset.content = content;
                break;
            case 'textonlyemail':
                asset.views.text.content = content;
                break;
            default:
        }

        return asset;
    };

    setContentBuilderPackageAssets = async (
        packageOut: any,
        contextAssets: any[]
    ) => {
        packageOut['contentBuilder'] = {};
        return (
            (packageOut['contentBuilder']['assets'] =
                contextAssets &&
                contextAssets.length &&
                contextAssets.map((asset: any) => {
                    return {
                        id: asset.id,
                        bldrId: asset.bldrId,
                        name: asset.name,
                        assetType: asset.assetType,
                        category: {
                            folderPath:
                                (asset.category && asset.category.folderPath) ||
                                asset.folderPath,
                        },
                        content: getContentBuilderAssetContent(asset),
                    };
                })) || []
        );
    };

    /**
     *
     * @param packageOut
     */
    setContentBuilderDependenciesFromPackage = async (packageOut: any) => {
        try {
            const newDependencies: { [key: string]: any } = {};
            for (const a in packageOut['contentBuilder']['assets']) {
                let asset = packageOut['contentBuilder']['assets'][a];
                let content = await getContentBuilderAssetContent(asset);
                asset.dependencies = [];

                for (const p in contentBuilderPackageReference) {
                    const reference = contentBuilderPackageReference[p];
                    let regex = `${reference}\\(['"](?<value>.+)['"]\\)`;
                    let ampscriptRegex = new RegExp(regex, 'g');
                    let matches = content && content.matchAll(ampscriptRegex);

                    for (const match of matches) {
                        const groups = Object.assign(match.groups, {});
                        let matchedValue = groups.value;

                        matchedValue = matchedValue.replace(/['"]/gm, '');

                        let dependency = await getAssetDependency(
                            this.sfmc,
                            reference,
                            matchedValue,
                            asset,
                            packageOut
                        );

                        matchedValue = dependency.matchedValue || matchedValue;
                        let dependencyReference = {
                            bldrId: dependency.bldrId,
                            context: dependency.context,
                            reference,
                        };

                        if (dependency && dependency.exists) {
                            asset.content = await setUpdatedPackageAssetContent(
                                dependencyReference,
                                matchedValue,
                                content
                            );
                            asset.dependencies.push(dependencyReference);
                            content = asset.content;

                            // remove matched value from dependency object
                            delete dependency.matchedValue;
                        } else {
                            let dependencyContext = dependency.context;

                            asset.dependencies.push({
                                bldrId: dependency.bldrId,
                                context: dependency.context,
                                reference,
                            });

                            asset.content = await setUpdatedPackageAssetContent(
                                dependencyReference,
                                matchedValue,
                                content
                            );
                            content = asset.content;

                            newDependencies[dependencyContext] =
                                newDependencies[dependencyContext] || {
                                    assets: [],
                                };
                            packageOut[dependencyContext] = packageOut[
                                dependencyContext
                            ] || {
                                assets: [],
                            };

                            newDependencies[dependencyContext]['assets'].push(
                                dependency.payload
                            );
                            packageOut[dependencyContext]['assets'].push(
                                dependency.payload
                            );
                        }
                    }
                }
            }

            return {
                newDependencies,
                packageOut,
            };
        } catch (err: any) {
            console.log(err);
            console.log('Some dependencies in package do not exist');
        }
    };
}
