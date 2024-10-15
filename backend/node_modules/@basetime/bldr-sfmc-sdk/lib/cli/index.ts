import { AutomationStudio } from './automationStudio';
import { ContentBuilder } from './contentBuilder';
import { EmailStudio } from './emailStudio';

import { CLI_Client } from './types/cli_client';

/**
 * Creates an instance of BLDR SDK.
 *
 * @param {object} AuthObject Auth Object for making requests
 */
export class CLI implements CLI_Client {
    contentBuilder: any;
    automationStudio: any;
    emailStudio: any;

    constructor(sfmc: any) {
        this.contentBuilder = new ContentBuilder(sfmc);
        this.emailStudio = new EmailStudio(sfmc);
        this.automationStudio = new AutomationStudio(
            sfmc,
            this.contentBuilder,
            this.emailStudio
        );
        // this.dataExtension = new DataExtension(this.client.soap);
        // this.query = new QueryDefinition(this.client.rest, this.client.soap);
    }
}
