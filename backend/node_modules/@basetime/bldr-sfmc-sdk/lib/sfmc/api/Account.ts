import { Client } from '../types/sfmc_client';
const { getProperties } = require('sfmc-soap-object-reference');
const ListDefinition = getProperties('List');
const AccountDefinition = getProperties('Account');

export class Account {
    client;
    constructor(client: Client) {
        this.client = client;
    }
    async getAccessTokenResponse() {
        const tokenResponse = await this.client.auth.getAccessToken();
        return tokenResponse;
    }
    /**
     * Retrieve SFMC Account details for an instance
     * @returns
     */
    async getInstanceDetails() {
        try {
            const request = await this.client.soap.retrieve(
                'List',
                ListDefinition,
                {
                    QueryAllAccounts: true,
                    filter: {
                        leftOperand: 'ListName',
                        operator: 'equals',
                        rightOperand: 'All Subscribers',
                    },
                }
            );

            if (request.OverallStatus.includes('Error:')) {
                throw new Error(request.OverallStatus);
            }

            return request;
        } catch (err: any) {
            return err;
        }
    }
    /**
     * Get a single Business Units details
     *
     * @param {number} mid
     * @returns
     */
    async getBusinessUnitDetails(mid: number) {
        try {
            const request = await this.client.soap.retrieve(
                'Account',
                AccountDefinition,
                {
                    QueryAllAccounts: true,
                    filter: {
                        leftOperand: 'ID',
                        operator: 'equals',
                        rightOperand: mid,
                    },
                }
            );

            if (request.OverallStatus.includes('Error:'))
                throw new Error(request.OverallStatus);

            return request;
        } catch (err: any) {
            return err;
        }
    }

    async getAllBusinessUnitDetails(mids?: number[]) {
        try {
            const businessUnitDetails = [];

            let midsArray;
            if (mids && Array.isArray(mids)) {
                midsArray = mids;
            }
            if (mids && !Array.isArray(mids)) {
                midsArray = [mids];
            } else {
                // If no argument is passed, get all Business Unit Details
                const getAllMidsRequest = await this.getInstanceDetails();

                if (
                    getAllMidsRequest &&
                    getAllMidsRequest.OverallStatus !== 'OK'
                ) {
                    throw new Error(getAllMidsRequest.OverallStatus);
                }

                midsArray =
                    (getAllMidsRequest &&
                        getAllMidsRequest.Results &&
                        getAllMidsRequest.Results.length &&
                        getAllMidsRequest.Results.map(
                            (BU: {
                                Client: {
                                    ID: number;
                                };
                            }) => {
                                return BU.Client.ID;
                            }
                        )) ||
                    [];
            }

            if (midsArray && midsArray.length) {
                for (let m in midsArray) {
                    const mid = midsArray[m];
                    const businessUnitDetail =
                        mid && (await this.getBusinessUnitDetails(mid));

                    businessUnitDetail &&
                        businessUnitDetail.Results &&
                        businessUnitDetails.push(...businessUnitDetail.Results);
                }
            }

            return businessUnitDetails;
        } catch (err: any) {
            return err.message;
        }
    }
}
