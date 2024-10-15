import { match } from 'assert';
import { el } from 'date-fns/locale';
import { guid } from '../..';
import { SFMC_Client } from '../../../types/sfmc_client';
/**
 * Gather dependency when Package Reference RegEx
 * @param reference
 * @param matchedValue
 * @param asset
 * @param assets
 * @returns
 */
const getAssetDependency = async (
    client: SFMC_Client,
    reference: string,
    matchedValue: string,
    asset: any,
    packageOut: {
        contentBuilder?: {
            assets: [
                {
                    id: number;
                    name: string;
                }
            ];
        };
    }
) => {
    let resp: {
        exists: Boolean;
        bldrId?: string;
        matchedValue: string;
        reference: string;
        context: string;
        payload: any;
        dependencies: {
            context: string;
            reference: string;
            bldrId: string;
        }[];
        assetType?: {
            name: string;
        };
    } = {
        exists: false,
        matchedValue,
        reference,
        context: '',
        payload: {},
        dependencies: [],
    };

    // Generate new bldrId for asset
    let assetExists: any | Boolean = false;

    let contentBlockPathArray: string[] | undefined;
    let contentBlockName: string | undefined;
    let contentBlockFolder;
    let bldrId: string;

    switch (reference) {
        case 'Lookup':
        case 'LookupOrderedRows':
        case 'LookupOrderedRowsCS':
        case 'LookupRows':
        case 'LookupRowsCS':
        case 'DataExtensionRowCount':
        case 'DeleteData':
        case 'DeleteDE':
        case 'InsertDE':
        case 'UpdateData':
        case 'UpdateDE':
        case 'UpsertData':
        case 'UpsertDE':
        case 'ClaimRow':
            resp.matchedValue = matchedValue.split(',')[0].trim();
            resp.context = 'dataExtension';
            resp.payload =
                await client.emailStudio.retrieveDataExtensionPayloadByName(
                    resp.matchedValue
                );
            bldrId = await guid();
            resp.payload.bldrId = bldrId;
            resp.payload.assetType = {
                name: 'dataextension',
            };
            resp.bldrId = bldrId;

            break;
        case 'ContentBlockById':
        case 'ContentBlockByID':
        case 'ContentBlockbyID':
            resp.context = 'contentBuilder';
            // Do not capture existing Content Builder assets if they already exist in package
            assetExists = packageOut.contentBuilder?.assets.find(
                (asset: { id: number }) =>
                    Number(asset.id) === Number(matchedValue)
            );

            // Do not capture existing Content Builder assets if they already exist in package
            if (assetExists) {
                assetExists.exists = true;
                assetExists.context = 'contentBuilder';
                return assetExists;
            } else {
                resp.payload = await client.asset.getByAssetId(matchedValue);
                bldrId = await guid();
                resp.payload.bldrId = bldrId;
                resp.bldrId = bldrId;
            }

            break;
        case 'ContentBlockByName':
            contentBlockPathArray = matchedValue.split('\\').filter(Boolean);
            contentBlockName = contentBlockPathArray.pop();
            contentBlockFolder =
                contentBlockPathArray[contentBlockPathArray.length - 1];

            // Do not capture existing Content Builder assets if they already exist in package
            assetExists = packageOut.contentBuilder?.assets.find(
                (asset: { name: string }) => asset.name === contentBlockName
            );
            resp.context = 'contentBuilder';

            if (assetExists) {
                assetExists.exists = true;
                assetExists.context = 'contentBuilder';
                return assetExists;
            } else {
                const dependencyRequest =
                    await client.asset.getAssetByNameAndFolder({
                        assetName: contentBlockName,
                        assetFolderName: contentBlockFolder,
                    });

                resp.payload = dependencyRequest;
            }

            bldrId = await guid();
            resp.payload.bldrId = bldrId;
            resp.bldrId = bldrId;
            break;
        default:
    }

    return resp;
};

const setUpdatedPackageAssetContent = (
    dependencyReference: {
        reference: string;
        bldrId: string;
    },
    matchedValue: string,
    assetContent: string
) => {
    const { reference, bldrId } = dependencyReference;

    switch (reference) {
        case 'Lookup':
        case 'LookupOrderedRows':
        case 'LookupOrderedRowsCS':
        case 'LookupRows':
        case 'LookupRowsCS':
        case 'DataExtensionRowCount':
        case 'DeleteData':
        case 'DeleteDE':
        case 'InsertDE':
        case 'UpdateData':
        case 'UpdateDE':
        case 'UpsertData':
        case 'UpsertDE':
        case 'ClaimRow':
            assetContent = assetContent.replaceAll(matchedValue, bldrId);
            break;
        case 'ContentBlockById':
        case 'ContentBlockByID':
        case 'ContentBlockbyID':
            assetContent = assetContent.replaceAll(matchedValue, bldrId);
            break;
        case 'ContentBlockByName':
            assetContent = assetContent.replaceAll(matchedValue, bldrId);

            break;
        default:
    }

    return assetContent;
};

export { getAssetDependency, setUpdatedPackageAssetContent };
