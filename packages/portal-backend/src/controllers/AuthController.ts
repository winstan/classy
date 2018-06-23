import Log from "../../../common/Log";

import {PersonController} from "./PersonController";
import {DatabaseController} from "./DatabaseController";
import {Auth} from "../Types";
import {GitHubActions} from "./GitHubController";

export class AuthController {

    private dc: DatabaseController = null;

    constructor() {
        this.dc = DatabaseController.getInstance();
    }

    // TODO: Think about the APIs for these methods. What do the controllers need?

    public async isValid(personId: string, token: string): Promise<boolean> {
        Log.trace("AuthController::isValid( " + personId + ", ... ) - start");
        let person = new PersonController().getPerson(personId);
        if (person !== null) {
            let valid = await this.verifyToken(personId, token);
            return valid;
        }
        return false;
    }

    private async verifyToken(personId: string, token: string): Promise<boolean> {
        Log.trace("AuthController::verifyToken( " + personId + " ) - start");
        let auth = <Auth> await this.dc.getAuth(personId);
        if (auth !== null) {
            if (auth.token === token) {
                Log.info("DatabaseController::verifyToken( " + personId + " ) - token verified");
                return true;
            } else {
                Log.info("DatabaseController::verifyToken( " + personId + " ) - token !verified");
                return false;
            }
        }
        Log.info("DatabaseController::verifyToken( " + personId + " ) - no token stored");
        return false;
    }

    public async isPrivileged(personId: string, token: string): Promise<{ isAdmin: boolean, isStaff: boolean }> {
        Log.trace("AuthController::isPrivileged( " + personId + ", ... ) - start");
        let person = await new PersonController().getPerson(personId);
        if (person !== null) {
            let valid = await this.isValid(personId, token);
            if (valid === true) {
                const isStaff = await new GitHubActions().isOnStaffTeam(personId);
                const isAdmin = await new GitHubActions().isOnAdminTeam(personId);
                return {isAdmin: isAdmin, isStaff: isStaff};
            }
        }
        return {isAdmin: false, isStaff: false};
    }

}
