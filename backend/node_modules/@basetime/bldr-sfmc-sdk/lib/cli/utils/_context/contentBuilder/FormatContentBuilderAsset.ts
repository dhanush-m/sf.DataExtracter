import { SFMC_Content_Builder_Asset } from '../../../../sfmc/types/objects/sfmc_content_builder_assets';
import { BLDR_SFMC_Content_Builder_Asset } from '../../../types/bldr_assets/sfmc_content_builder_asset';

import { guid } from '../../index';

interface BLDR_Folder {
    ID: number;
    Name: string;
    ContentType: string;
    ParentFolder: {
        Name?: string;
        ID: number;
    };
    FolderPath?: string;
}

/**
 * Format raw API response to be slimmed down object
 *
 * @param asset
 * @param folders
 * @returns
 */
const setAssetPostObject = (
    asset: SFMC_Content_Builder_Asset,
    folders: BLDR_Folder[]
) => {
    // Generate new bldrId for asset
    const bldrId = guid();

    // Find Compiled Folder Path from Folders Array
    const findAssetsFolderObject = folders.find(
        (folder) =>
            folder.ID === asset.category.id ||
            folder.ParentFolder.ID === asset.category.id
    );

    // Set Assets folderPath or initiate as blank
    const folderPath = findAssetsFolderObject
        ? findAssetsFolderObject.FolderPath
        : '';

    // Create JSON structure for new asset post
    let post: BLDR_SFMC_Content_Builder_Asset = {
        id: asset.id,
        bldrId,
        name: asset.name,
        customerKey: asset.customerKey,
        assetType: asset.assetType,
        category: {
            id: asset.category.id,
            name: asset.category.name,
            parentId: asset.category.parentId,
            folderPath,
        },
    };

    if (asset.content) {
        post.content = asset.content;
    }
    if (asset.meta) {
        post.meta = asset.meta;
    }
    if (asset.slots) {
        post.slots = asset.slots;
    }
    if (asset.views) {
        post.views = asset.views;
    }

    if (asset.legacyData) {
        post.legacyData = asset.legacyData;
    }

    if (asset.businessUnitAvailability) {
        post.businessUnitAvailability = asset.businessUnitAvailability;
    }

    if (asset.sharingProperties) {
        post.sharingProperties = asset.sharingProperties;
    }

    // if (asset.assetType.displayName === 'Image') {
    //     post.name =
    //         asset.name.indexOf('.') === -1
    //             ? asset.name
    //             : asset.name.substring(0, asset.name.indexOf('.'));
    //     post.publishedURL = asset.fileProperties.publishedURL;
    //     post.file = await this.bldr.asset.getImageFile(asset.id);
    // }

    return post;
};
/**
 * Method to format API response from SFMC into minimum required POST/PUT JSON objects
 * Updates Category object with full folder paths
 * Gathers additional data for Image assets
 *
 * @param {object} results from API Request
 * @param {object} folderPaths category object
 * @returns {object} Array of formatted asset payloads
 */
const formatContentBuilderAssets = async (
    results: SFMC_Content_Builder_Asset,
    folders: BLDR_Folder[]
) => {
    if (Array.isArray(results) && results.length !== 0) {
        const formatAllResults = await Promise.all(
            results.map((result) => setAssetPostObject(result, folders))
        );
        return formatAllResults;
    } else if (Array.isArray(results) && results.length === 0) {
        return [];
    } else if (!Array.isArray(results)) {
        return setAssetPostObject(results, folders);
    }
};

export { formatContentBuilderAssets };
