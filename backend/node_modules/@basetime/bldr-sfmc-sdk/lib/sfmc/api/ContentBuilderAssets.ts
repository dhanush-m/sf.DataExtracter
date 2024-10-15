import { Client } from '../types/sfmc_client';
import { chunk } from '../utils/chunkArray';
import { handleError } from '../utils/handleError';
import { concatByKey, sumByKey } from '../utils/sumByKeys';

export class ContentBuilderAsset {
    client;
    constructor(client: Client) {
        this.client = client;
    }
    /**
     * Retrieve Asset Object by assetID
     *
     * @param {number} assetId
     * @returns
     */
    async getByAssetId(assetId: number) {
        try {
            if (!assetId) {
                throw new Error('assetId argument is required');
            }

            return this.client.rest.get(`/asset/v1/content/assets/${assetId}`);
        } catch (err: any) {
            return handleError(err);
        }
    }
    /**
     * Retrieve Email Asset based on Legacy Asset ID
     *
     * @param {number} assetId
     * @returns
     */
    async getAssetByLegacyId(assetId: number) {
        try {
            if (!assetId) {
                throw new Error('assetId argument is required');
            }

            return this.client.rest.post('/asset/v1/content/assets/query', {
                page: {
                    page: 1,
                    pageSize: 200,
                },
                query: {
                    property: 'data.email.legacy.legacyId',
                    simpleOperator: 'equal',
                    value: assetId,
                },
            });
        } catch (err: any) {
            return handleError(err);
        }
    }
    /**
     * Retrieve bulk assets from array of categoryIds
     *
     * @param {number[]} folderIdArray
     * @returns Promise<void>
     */
    async getAssetsByFolderArray(folderIdArray: number[]) {
        // TODO: add auto pagination
        try {
            if (!Array.isArray(folderIdArray)) {
                throw new Error('folderIdArray argument must be an array');
            }
            const chunkedArrays = await chunk(folderIdArray, 6);
            const assetRequests = await Promise.all(
                chunkedArrays.map(async (assetArray) => {
                    return this.client.rest.post(
                        '/asset/v1/content/assets/query',
                        {
                            page: {
                                page: 1,
                                pageSize: 200,
                            },
                            query: {
                                property: 'category.id',
                                simpleOperator: 'in',
                                value: assetArray,
                            },
                            sort: [
                                {
                                    property: 'id',
                                    direction: 'ASC',
                                },
                            ],
                        }
                    );
                })
            );

            return {
                count: sumByKey(assetRequests, 'count'),
                items: concatByKey(assetRequests, 'items'),
            };
        } catch (err: any) {
            return err;
        }
    }

    /**
     * Retrieve Asset Object by asset name and folder name
     *
     * @param request.assetName
     * @param request.assetFolderName
     * @returns
     */
    async getAssetByNameAndFolder(request: {
        assetName: string;
        assetFolderName: string;
    }) {
        try {
            if (!request.assetName) {
                throw new Error(`assetName is required`);
            }

            if (!request.assetFolderName) {
                throw new Error(`assetFolderName is required`);
            }

            return this.client.rest.post('/asset/v1/content/assets/query', {
                page: {
                    page: 1,
                    pageSize: 200,
                },
                query: {
                    leftOperand: {
                        property: 'name',
                        simpleOperator: 'equals',
                        value: request.assetName,
                    },
                    logicalOperator: 'AND',
                    rightOperand: {
                        property: 'category.name',
                        simpleOperator: 'equals',
                        value: request.assetFolderName,
                    },
                },
                sort: [
                    {
                        property: 'name',
                        direction: 'DESC',
                    },
                ],
            });
        } catch (err: any) {
            return err;
        }
    }

    /**
     * Search for assets based on search property and term
     *
     * @param {string} request.searchKey
     * @param {string} request.searchTerm
     * @returns
     */
    async searchAssets(request: { searchKey: string; searchTerm: string }) {
        try {
            return this.client.rest.post('/asset/v1/content/assets/query', {
                page: {
                    page: 1,
                    pageSize: 200,
                },
                query: {
                    property: request.searchKey,
                    simpleOperator: 'like',
                    value: request.searchTerm,
                },
                sort: [
                    {
                        property: 'name',
                        direction: 'DESC',
                    },
                ],
            });
        } catch (err: any) {
            return handleError(err);
        }
    }

    /**
     * Create content builder asset
     *
     * @param {number} request.id
     * @param {string} request.name
     * @param {string} request.assetType.name
     * @param {string} request.assetType.displayname
     * @param {number} request.assetType.id
     * @param {number} request.category.id
     * @param {string} request.category.name
     * @param {object} request.content
     * @param {object} request.meta
     * @param {object} request.slots
     * @param {object} request.views
     * @returns
     */
    async postAsset(request: {
        id: number;
        name: string;
        assetType: object;
        category: {
            id: number;
            name: string;
        };
        content?: object;
        meta?: object;
        slots?: object;
        views?: object;
    }) {
        try {
            return this.client.rest.post(`/asset/v1/content/assets/`, request);
        } catch (err) {
            return err;
        }
    }

    /**
     * Create content builder asset
     *
     * @param {number} request.id
     * @param {string} request.name
     * @param {string} request.assetType.name
     * @param {string} request.assetType.displayname
     * @param {number} request.assetType.id
     * @param {number} request.category.id
     * @param {string} request.category.name
     * @param {object} request.content
     * @param {object} request.meta
     * @param {object} request.slots
     * @param {object} request.views
     * @returns
     */
    async putAsset(request: {
        id: number;
        name: string;
        assetType: object;
        category: {
            id: number;
            name: string;
        };
        content?: object;
        meta?: object;
        slots?: object;
        views?: object;
    }) {
        try {
            if (!request.id) {
                throw new Error('Asset Id is required');
            }

            const assetId = request.id;
            return this.client.rest.put(
                `/asset/v1/content/assets/${assetId}`,
                request
            );
        } catch (err) {
            return err;
        }
    }
    /**
     *
     * @param assetId
     */
    async deleteAsset(assetId: number) {
        try {
            if (!assetId) {
                throw new Error('Asset Id is required');
            }

            console.log(assetId);

            const apiRequest = await this.client.rest.delete(
                `/asset/v1/content/assets/${assetId}`
            );

            console.log('apiRequest', apiRequest);
            return apiRequest;
        } catch (err) {
            console.log('(e)', err);
            return err;
        }
    }
    /**
     * Get Image data from Image assetId
     * Will also grab the base64 file data and add it to the fileProperties object
     *
     * @param {number} assetId
     * @returns
     */
    async getImageData(assetId: number) {
        try {
            if (!assetId) {
                throw new Error('Asset Id is required');
            }

            let apiRequest = await this.client.rest.get(
                `/asset/v1/content/assets/${assetId}`
            );

            if (
                apiRequest &&
                Object.prototype.hasOwnProperty.call(
                    apiRequest,
                    'fileProperties'
                )
            ) {
                apiRequest.fileProperties.fileData = await this.client.rest.get(
                    `/asset/v1/content/assets/${assetId}/file`
                );
            }

            return apiRequest;
        } catch (err) {
            return err;
        }
    }
}
