import { SFMC_Automation } from '../../../types/bldr_assets/sfmc_automation';
import { guid } from '../..';

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
const setAssetPostObject = (asset: SFMC_Automation, folders: BLDR_Folder[]) => {
    // Generate new bldrId for asset
    const bldrId = guid();

    // Find Compiled Folder Path from Folders Array
    const findAssetsFolderObject = folders.find(
        ({ ID }) => ID === asset.categoryId
    );

    // Set Assets folderPath or initiate as blank
    const folderPath = findAssetsFolderObject
        ? findAssetsFolderObject.FolderPath
        : '';
    const folderName = findAssetsFolderObject
        ? findAssetsFolderObject.Name
        : '';

    // Create JSON structure for new asset post
    let post: SFMC_Automation = {
        id: asset.id,
        bldrId,
        name: asset.name,
        key: asset.key,
        categoryId: asset.categoryId,
        category: {
            folderPath,
            name: folderName,
        },
        description: asset.description,
        typeId: asset.typeId,
        type: asset.type,
        statusId: asset.statusId,
        status: asset.status,
        steps: asset.steps,
        assetType: {
            name: 'automation',
            folder: 'Automation Studio/my automations',
        },
    };

    if (asset.schedule && asset.schedule.scheduleStatus) {
        post.schedule = {
            scheduleStatus: asset.schedule.scheduleStatus,
        };
    }

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
const formatAutomation = async (
    results: SFMC_Automation,
    folders: BLDR_Folder[]
) => {
    const formattedAssets = [];
    if (Array.isArray(results) && results.length !== 0) {
        for (const r in results) {
            const asset = results[r];
            const post = setAssetPostObject(asset, folders);
            formattedAssets.push(post);
        }
    } else {
        const post = setAssetPostObject(results, folders);
        formattedAssets.push(post);
    }

    return formattedAssets;
};

export { formatAutomation };
