import { SFMC_SOAP_Folder } from '../types/objects/sfmc_soap_folders';
import { Client } from '../types/sfmc_client';
import { SFMCContextMapping } from '../types/sfmc_context_mapping';
import { handleError } from '../utils/handleError';

const { getProperties } = require('sfmc-soap-object-reference');
const DataFolder = getProperties('DataFolder');

export class Folder {
    client;
    sfmc_context;
    constructor(client: Client, sfmc_context_mapping: SFMCContextMapping[]) {
        this.client = client;
        this.sfmc_context = sfmc_context_mapping;
    }

    /**
     * Search SFMC Folders using SOAP DataFolder Object
     *
     * @param {string} request.contentType
     * @param {string} request.searchKey
     * @param {string} request.searchTerm
     * @returns
     */
    async search(request: {
        contentType: string;
        searchKey?: string;
        searchTerm?: string;
        parentId?: number;
    }): Promise<{
        OverallStatus: string;
        Results: any[];
    }> {
        try {
            let filter;
            if (request.parentId) {
                filter = {
                    leftOperand: {
                        leftOperand: 'ContentType',
                        operator: 'equals',
                        rightOperand: request.contentType,
                    },
                    operator: 'AND',
                    rightOperand: {
                        leftOperand: 'ParentFolder.ID',
                        operator: 'equals',
                        rightOperand: request.parentId,
                    },
                };

                // filter = {
                //     leftOperand: {
                //         leftOperand: 'ContentType',
                //         operator: 'equals',
                //         rightOperand: request.contentType,
                //     },
                //     operator: 'AND',
                //     rightOperand: complexFilterPart
                // }
            } else {
                filter = {
                    leftOperand: {
                        leftOperand: 'ContentType',
                        operator: 'equals',
                        rightOperand: request.contentType,
                    },
                    operator: 'AND',
                    rightOperand: {
                        leftOperand: request.searchKey,
                        operator: 'like',
                        rightOperand: request.searchTerm,
                    },
                };
            }

            const resp = await this.client.soap.retrieveBulk(
                'DataFolder',
                DataFolder,
                {
                    filter,
                }
            );

            if (resp.OverallStatus !== 'OK') {
                return resp.OverallStatus;
            }

            return resp;
        } catch (err: any) {
            return err;
        }
    }
    /**
     * Get a single SFMC Folder Object via SOAP API
     * If subfolders === false id refers to the folder you are retrieving
     * If subfolders === true id refers to the parent folder
     *
     * @param {string} request.contentType
     * @param {number} request.categoryId
     * @returns
     */
    async getFolder(request: {
        contentType: string;
        categoryId: number;
    }): Promise<{
        OverallStatus: string;
        Results: SFMC_SOAP_Folder[];
    }> {
        try {
            const resp = await this.client.soap.retrieve(
                'DataFolder',
                DataFolder,
                {
                    filter: {
                        leftOperand: {
                            leftOperand: 'ContentType',
                            operator: 'equals',
                            rightOperand: request.contentType,
                        },
                        operator: 'AND',
                        rightOperand: {
                            leftOperand: 'ID',
                            operator: 'equals',
                            rightOperand: request.categoryId,
                        },
                    },
                }
            );

            if (resp.OverallStatus !== 'OK') {
                throw new Error('Unable to Retrieve Folders');
            }

            return resp;
        } catch (err: any) {
            return err;
        }
    }
    /**
     * Get SFMC Subfolders based on parentId Object via SOAP API
     *
     * @param {string} request.contentType
     * @param {number} request.parentId
     * @returns
     */
    async getSubfolders(request: {
        contentType: string;
        parentId: number;
    }): Promise<SFMC_SOAP_Folder[]> {
        try {
            type folders = SFMC_SOAP_Folder;
            const results: folders[] = [];

            const response: {
                OverallStatus: string;
                Results: SFMC_SOAP_Folder[];
            } = await this.client.soap.retrieveBulk('DataFolder', DataFolder, {
                filter: {
                    leftOperand: {
                        leftOperand: 'ContentType',
                        operator: 'equals',
                        rightOperand: request.contentType,
                    },
                    operator: 'AND',
                    rightOperand: {
                        leftOperand: 'ParentFolder.ID',
                        operator: 'equals',
                        rightOperand: request.parentId,
                    },
                },
            });

            if (response && response.OverallStatus !== 'OK') {
                throw new Error('Unable to Retrieve Folders');
            }

            const responseResults = response.Results || [];
            responseResults &&
                responseResults.length &&
                results.push(...responseResults);
            return results;
        } catch (err: any) {
            return err;
        }
    }
    /**
     * Method to compile folder path for for Asset Clone
     *
     * @param {string} request.contentType
     * @param {number} request.categoryId
     * @returns {Promise<Object[]>}
     */
    async getParentFoldersRecursive(request: {
        contentType: string;
        categoryId: number;
    }): Promise<{ results: any[]; stop: Boolean }> {
        let parentId;
        let stopFolderId;
        let results: object[] = [];

        const rootFolderContext = this.sfmc_context.find(
            (ctx) => ctx.contentType === request.contentType
        );

        if (rootFolderContext) {
            const rootFolderRequest = await this.search({
                contentType: request.contentType,
                searchKey: 'Name',
                searchTerm: rootFolderContext.rootName,
            });

            if (
                rootFolderRequest &&
                rootFolderRequest.Results &&
                rootFolderRequest.Results.length
            ) {
                const rootFolder =
                    rootFolderRequest.Results &&
                    rootFolderRequest.Results.find(
                        (folder) => folder.Name === rootFolderContext.rootName
                    );
                results = rootFolder && [rootFolder];

                if (rootFolderRequest.Results[0].ID === request.categoryId) {
                    return {
                        results,
                        stop: false,
                    };
                }
            }
        }

        const initialCategory = await this.getFolder(request);
        if (initialCategory.OverallStatus !== 'OK') {
            throw new Error(initialCategory.OverallStatus);
        }

        if (
            initialCategory &&
            initialCategory.Results &&
            initialCategory.Results.length
        ) {
            const initResult = initialCategory.Results[0];
            results = [...results, ...initialCategory.Results];
            if (
                initResult &&
                initResult.ParentFolder &&
                initResult.ParentFolder.Name &&
                rootFolderContext &&
                initResult.ParentFolder.Name === rootFolderContext.rootName
            ) {
                return {
                    results,
                    stop: false,
                };
            } else {
                parentId =
                    (initResult &&
                        initResult.ParentFolder &&
                        initResult.ParentFolder.ID) ||
                    null;
            }
        }

        if (
            initialCategory &&
            initialCategory.Results &&
            initialCategory.Results[0] &&
            initialCategory.Results[0].ParentFolder &&
            initialCategory.Results[0].ParentFolder.ContentType !==
                'shared_items'
        ) {
            if (parentId) {
                do {
                    const parentRequest =
                        parentId &&
                        (await this.getFolder({
                            contentType: request.contentType,
                            categoryId: parentId,
                        }));

                    if (parentRequest && parentRequest.OverallStatus !== 'OK') {
                        throw new Error(parentRequest.OverallStatus);
                    }

                    if (
                        parentRequest &&
                        parentRequest.Results &&
                        parentRequest.Results.length
                    ) {
                        const parentResult: {
                            ParentFolder: {
                                ID: number;
                                ContentType: string;
                            };
                        } = parentRequest.Results[0];

                        results.push(...parentRequest.Results);
                        parentId =
                            (parentResult &&
                                parentResult.ParentFolder &&
                                parentResult.ParentFolder.ContentType !==
                                    'shared_data' &&
                                parentResult.ParentFolder.ID) ||
                            0;
                    }
                } while (parentId !== 0);
            }
        }

        return {
            results,
            stop: false,
        };
    }
    /**
     * Method to gather and format all SFMC Folders recursively from top level starting point
     *
     * @param {string} request.contentType
     * @param {integer} request.categoryId
     * @returns
     */
    async getSubfoldersRecursive(request: {
        contentType: string;
        categoryId: number;
    }) {
        try {
            let folders: number[] = [request.categoryId];
            let results: any[] = [];

            // Recursively get folders from SFMC
            do {
                const subfoldersArrayRequest = await Promise.all(
                    folders.map(async (categoryId: number) => {
                        // SFMC Folder response checking for subfolders
                        let subfolderRequest = await this.getSubfolders({
                            contentType: request.contentType,
                            parentId: categoryId,
                        });

                        if (
                            subfolderRequest &&
                            Array.isArray(subfolderRequest) &&
                            subfolderRequest.length
                        ) {
                            let subfolderIdArray = subfolderRequest.map(
                                (folder: { ID: number }) => folder.ID
                            );

                            return {
                                categoryId: categoryId,
                                subfolderIdArray: subfolderIdArray,
                                subfolderRequest: subfolderRequest,
                            };
                        } else {
                            return {
                                categoryId: categoryId || null,
                                subfolderIdArray: subfolderRequest || [],
                                subfolderRequest: subfolderRequest || [],
                            };
                        }
                    })
                ).then((response: any) => {
                    const foldersMap = response
                        .map((res: any) => [...res.subfolderIdArray])
                        .flat();

                    const resultsMap = response
                        .map((res: any) => [...res.subfolderRequest])
                        .flat();

                    return {
                        folderIds: foldersMap || [],
                        results: resultsMap || [],
                    };
                });

                if (
                    subfoldersArrayRequest &&
                    subfoldersArrayRequest.folderIds &&
                    subfoldersArrayRequest.folderIds.length
                ) {
                    folders = [];
                    folders = subfoldersArrayRequest.folderIds;
                    results = subfoldersArrayRequest.results &&
                        subfoldersArrayRequest.results.length && [
                            ...results,
                            ...subfoldersArrayRequest.results,
                        ];
                } else {
                    folders = [];
                }
            } while (folders.length !== 0);

            return results.sort((a: any, b: any) => b.ID - a.ID);
        } catch (err) {
            return err;
        }
    }
    /**
     * Retrieve all folders top and bottom from a specific categoryId
     *
     * @param {string} request.contentType
     * @param {integer} request.categoryId
     * @returns
     */
    async getFoldersFromMiddle(request: {
        contentType: string;
        categoryId: number;
    }) {
        let up = (await this.getParentFoldersRecursive(request)) || [];
        let down =
            (!up.stop && (await this.getSubfoldersRecursive(request))) || [];

        return {
            up,
            down,
            full: [
                ...new Map(
                    [...up.results, ...down].map((item) => [item['ID'], item])
                ).values(),
            ],
        };
    }
    /**
     * Create a folder in SFMC via SOAP Data Folder Object
     *
     * @param request.contentType
     * @param request.name
     * @param request.parentId
     * @returns {Promise<void>}
     */
    async createFolder(request: {
        contentType: string;
        name: string;
        parentId: number;
    }): Promise<void> {
        try {
            const resp = await this.client.soap.create(
                'DataFolder',
                {
                    ContentType: request.contentType,
                    Name: request.name,
                    Description: request.name,
                    IsActive: true,
                    IsEditable: true,
                    AllowChildren: true,
                    ParentFolder: {
                        ID: request.parentId,
                    },
                },
                {}
            );

            return resp;
        } catch (err: any) {
            if (err.response.data.includes('cannot contain child folders')) {
                await this._updateAllowChildren({
                    contentType: request.contentType,
                    categoryId: request.parentId,
                });
                const errCreate = await this.createFolder(request);
                return errCreate;
            }

            return handleError(err);
        }
    }
    /**
     * When a folder exists in SFMC and is created in the UI, it by default does not allow children folders. This function updates that permission on the folder.
     *
     * @param request.contentType
     * @param request.categoryId
     * @returns
     */
    async _updateAllowChildren(request: {
        contentType: string;
        categoryId: number;
    }) {
        try {
            const resp = await this.client.soap.update(
                'DataFolder',
                {
                    ID: request.categoryId,
                    ContentType: request.contentType,
                    IsActive: true,
                    IsEditable: true,
                    AllowChildren: true,
                },
                {}
            );

            return resp;
        } catch (err) {
            return handleError(err);
        }
    }
}
