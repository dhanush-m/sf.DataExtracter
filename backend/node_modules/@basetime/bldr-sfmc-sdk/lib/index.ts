import { SFMC } from './sfmc/index';
import { CLI } from './cli/index';
import { AuthObject } from './sfmc/types/sfmc_auth_object';
import { CLI_Client } from './cli/types/cli_client';
import { SFMC_Client } from './cli/types/sfmc_client';
/*
 * Creates an instance of BLDR SDK.
 *
 * @param {object} authObject Auth Object for making requests
 */
class BLDR {
    sfmc: SFMC_Client;
    cli: CLI_Client;
    constructor(authObject: AuthObject) {
        this.sfmc = new SFMC(authObject);
        this.cli = new CLI(this.sfmc);
    }
}

module.exports = BLDR;
