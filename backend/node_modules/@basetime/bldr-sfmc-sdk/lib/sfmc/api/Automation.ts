import { Client } from '../types/sfmc_client';
import { MappingByActivityTypeId } from '../utils/automationActivities';
import { handleError } from '../utils/handleError';

const { getProperties } = require('sfmc-soap-object-reference');
const automationDefinition = getProperties('Automation');
const emailSendDefinition = getProperties('EmailSendDefinition');

export class Automation {
    client;
    constructor(client: Client) {
        this.client = client;
    }
    /**
     * Search for Automations by SOAP API
     * @param {string} request.searchKey
     * @param {string} request.searchTerm
     * @returns
     */
    async searchAutomations(request: {
        searchKey: string;
        searchTerm: string;
    }) {
        try {
            return this.client.soap.retrieveBulk(
                'Program',
                automationDefinition,
                {
                    filter: {
                        leftOperand: request.searchKey,
                        operator: 'like',
                        rightOperand: request.searchTerm,
                    },
                }
            );
        } catch (err: any) {
            return handleError(err);
        }
    }
    /**
     * Search for Automation Studio Activity by Type and Name
     *
     * @param {string} request.searchActivity
     * @param {string} request.searchTerm
     * @returns
     */
    async searchActivityByName(request: {
        searchActivity: string;
        searchTerm: string;
    }) {
        try {
            return this.client.rest.get(
                `/automation/v1/${request.searchActivity}?$filter=name='${request.searchTerm}'`
            );
        } catch (err: any) {
            return handleError(err);
        }
    }
    /**
     * Search for Automation Studio Activity by Type and Name
     *
     * @param {string} request.searchActivity
     * @param {string} request.searchTerm
     * @returns
     */
    async searchActivityByCategoryId(request: {
        searchActivity: string;
        categoryId: string;
    }) {
        try {
            return this.client.rest.get(
                `/automation/v1/${request.searchActivity}/category/${request.categoryId}`
            );
        } catch (err: any) {
            return handleError(err);
        }
    }
    /**
     * Retrieve multiple automations from array of categoryIds
     *
     * @param {number[]} categoryIds
     * @returns
     */
    async getAssetsByFolderArray(categoryIds: number[]): Promise<object[]> {
        let result = [];

        if (!categoryIds || !Array.isArray(categoryIds)) {
            throw new Error('folderIds is required and must be an array');
        }

        for (const f in categoryIds) {
            const categoryId = categoryIds[f];
            const request = await this.client.rest.get(
                `/legacy/v1/beta/automations/automation/definition/?$sort=lastRunTime desc&categoryId=${categoryId}`
            );

            if (Object.prototype.hasOwnProperty.call(request, 'entry')) {
                result.push(...request.entry);
            }
        }

        return result;
    }
    /**
     * Retrieve an automation by automation key
     *
     * @param {string} automationKey
     * @returns {Promise<void>}
     */
    async getAutomationByKey(automationKey: string): Promise<void> {
        try {
            return this.client.rest.get(
                `/automation/v1/automations/${automationKey}`
            );
        } catch (err) {
            return handleError(err);
        }
    }
    /**
     * Retrieve multiple automations by automation keys array
     *
     * @param {string[]} automationKeys
     * @returns {Promise<void>}
     */
    async getAutomationsByKey(automationKeys: string[]): Promise<object[]> {
        try {
            const result = [];

            if (!Array.isArray(automationKeys)) {
                throw new Error('automationKeys needs to be an array');
            }

            for (const a in automationKeys) {
                const key = automationKeys[a];
                const request = await this.client.rest.get(
                    `/automation/v1/automations/${key}`
                );

                if (Object.prototype.hasOwnProperty.call(request, 'id')) {
                    result.push(request);
                }
            }

            return result;
        } catch (err) {
            return handleError(err);
        }
    }
    /**
     * Retrieve automation activity details
     *
     * @param request.assetType
     * @param request.activityObjectId
     * @returns
     */
    async getAutomationActivity(request: {
        activityType: string;
        activityObjectId: string;
    }) {
        try {
            const resp = await this.client.rest.get(
                `/automation/v1/${request.activityType}/${request.activityObjectId}`
            );

            return resp;
        } catch (err) {
            return err;
        }
    }
    /**
     *
     * @param automation {object}
     * @returns
     */
    async getAutomationActivities(automation: {
        steps: {
            activities: {
                objectTypeId: number;
                activityObjectId: string;
            }[];
        }[];
    }) {
        try {
            const activityDefinitions = [];

            if (Object.prototype.hasOwnProperty.call(automation, 'steps')) {
                for (const as in automation.steps) {
                    const steps = automation.steps[as];

                    for (const sa in steps.activities) {
                        const activity: {
                            objectTypeId: number;
                            activityObjectId: string;
                        } = steps.activities[sa];

                        const assetType = MappingByActivityTypeId(
                            activity.objectTypeId
                        );

                        if (assetType) {
                            // Most activities can be pulled from the automations endpoint
                            const activityObjectId = activity.activityObjectId;

                            let stepActivity;
                            const objectIdKey: string =
                                (assetType &&
                                    assetType.objectIdKey &&
                                    typeof assetType.objectIdKey === 'string' &&
                                    assetType.objectIdKey) ||
                                'id';

                            // EmailSendDefinitions are not on the automations REST endpoint
                            if (assetType.name === 'userinitiatedsend') {
                                stepActivity =
                                    await this.getEmailSendDefinitionActivity(
                                        activityObjectId
                                    );

                                if (stepActivity && !stepActivity.CustomerKey) {
                                    stepActivity = {
                                        ...steps.activities[sa],
                                        [objectIdKey]: activityObjectId,
                                        hasBeenDeleted: true,
                                    };
                                }
                            } else if (assetType.name === 'filteractivity') {
                                stepActivity =
                                    await this.retrieveAutomationActivityDefinition(
                                        assetType,
                                        activityObjectId
                                    );

                                if (stepActivity) {
                                    const activityDefinitionId =
                                        stepActivity.filterDefinitionId;

                                    const filterDefinition =
                                        await this.retrieveFilterDefinition(
                                            activityDefinitionId
                                        );

                                    if (filterDefinition) {
                                        stepActivity.filterDefinition =
                                            filterDefinition;
                                    } else {
                                        stepActivity.filterDefinition = {
                                            ...steps.activities[sa],
                                            filterDefinitionId:
                                                activityDefinitionId,
                                            hasBeenDeleted: true,
                                        };
                                    }
                                } else {
                                    stepActivity = {
                                        ...steps.activities[sa],
                                        [objectIdKey]: activityObjectId,
                                        hasBeenDeleted: true,
                                    };
                                }
                            } else {
                                stepActivity = await this.client.rest.get(
                                    `/automation/v1/${assetType.api}/${activityObjectId}`
                                );

                                const activityResponseKeys =
                                    Object.keys(stepActivity);

                                if (
                                    stepActivity &&
                                    !activityResponseKeys.some((key) =>
                                        [
                                            'key',
                                            'customerKey',
                                            'CustomerKey',
                                        ].includes(key)
                                    )
                                ) {
                                    stepActivity = {
                                        ...steps.activities[sa],
                                        [objectIdKey]: activityObjectId,
                                        hasBeenDeleted: true,
                                    };
                                }
                            }

                            stepActivity.assetType = assetType;
                            stepActivity.category = {
                                folderPath: assetType.folder,
                            };

                            activityDefinitions.push(stepActivity);
                        }
                    }
                }
            }
            return activityDefinitions;
        } catch (err) {
            return err;
        }
    }
    async retrieveAutomationActivityDefinition(
        assetType: { api: string },
        activityObjectId: string
    ) {
        try {
            const stepActivity = await this.client.rest.get(
                `/automation/v1/${assetType.api}/${activityObjectId}`
            );

            return stepActivity;
        } catch (err) {
            return null;
        }
    }
    async retrieveFilterDefinition(activityDefinitionId: string) {
        try {
            return this.client.rest.get(
                `/email/v1/filters/filterdefinition/${activityDefinitionId}`
            );
        } catch (err) {
            return null;
        }
    }
    /**
     * Retrieve Email Send Definition
     *
     * @param {string} activityObjectId
     * @returns
     */
    async getEmailSendDefinitionActivity(activityObjectId: string): Promise<{
        ObjectID: string;
        CustomerKey: string;
        Name: string;
        Description: string;
        CategoryID: number;
        SendClassification: {
            CustomerKey: string;
        };
        SuppressTracking: Boolean;
        IsSendLogging: Boolean;
        SendDefinitionList: {
            PartnerKey: string;
            ObjectID: string;
            List: {
                PartnerKey: string;
                ID: number;
                ObjectID: string;
            }[];
            SendDefinitionListType: number;
            CustomObjectID: string;
            DataSourceTypeID: number;
            IsTestObject: Boolean;
            SalesForceObjectID: string;
            Name: string;
        };
        Email: {
            ID: number;
        };
        BccEmail: string;
        AutoBccEmail: string;
        TestEmailAddr: string;
        EmailSubject: string;
        DynamicEmailSubject: string;
        IsMultipart: Boolean;
        IsWrapped: Boolean;
        DeduplicateByEmail: Boolean;
        ExclusionFilter: string;
        Additional: string;
        CCEmail: string;
    }> {
        try {
            const activityResponse = await this.client.soap.retrieve(
                'EmailSendDefinition',
                [...emailSendDefinition],
                {
                    filter: {
                        leftOperand: 'ObjectID',
                        operator: 'equals',
                        rightOperand: activityObjectId,
                    },
                }
            );

            if (
                activityResponse.OverallStatus !== 'OK' ||
                activityResponse.Results.length === 0
            ) {
                throw new Error(activityResponse.OverallStatus);
            }

            const result = activityResponse.Results[0];

            return {
                ObjectID: result.ObjectID,
                CustomerKey: result.CustomerKey,
                Name: result.Name,
                Description: result.Description,
                CategoryID: result.CategoryID,
                SendClassification: {
                    CustomerKey: result.SendClassification.CustomerKey,
                },
                SuppressTracking: result.SuppressTracking,
                IsSendLogging: result.IsSendLogging,
                SendDefinitionList: result.SendDefinitionList,
                Email: {
                    ID: result.Email.ID,
                },
                BccEmail: result.BccEmail,
                AutoBccEmail: result.AutoBccEmail,
                TestEmailAddr: result.TestEmailAddr,
                EmailSubject: result.EmailSubject,
                DynamicEmailSubject: result.DynamicEmailSubject,
                IsMultipart: result.IsMultipart,
                IsWrapped: result.IsWrapped,
                DeduplicateByEmail: result.DeduplicateByEmail,
                ExclusionFilter: result.ExclusionFilter,
                Additional: result.Additional,
                CCEmail: result.CCEmail,
            };
        } catch (err: any) {
            return err;
        }
    }

    searchActivity = async (searchActivity: string, searchTerm: string) => {
        try {
            return this.client.rest.get(
                `/automation/v1/${searchActivity}?$filter=name='${searchTerm}'`
            );
        } catch (err: any) {
            return err;
        }
    };

    /**
     *
     * @param asset
     * @returns
     */
    postAsset = async (asset: any) => {
        try {
            const assetType = asset.assetType;
            const resp = await this.client.rest.post(
                `/automation/v1/${assetType}`,
                asset
            );

            return resp;
        } catch (err: any) {
            return err;
        }
    };
    /**
     *
     * @param asset
     * @returns
     */
    async patchAutomationAsset(asset: { [key: string]: any }) {
        try {
            const assetType = asset.assetType;
            const objectKey: string = assetType.objectIdKey;
            const assetObjectId: string = asset && asset[objectKey];

            const resp = await this.client.rest.patch(
                `/automation/v1/${assetType.api}/${assetObjectId}`,
                asset
            );

            return resp;
        } catch (err) {
            return err;
        }
    }
}
