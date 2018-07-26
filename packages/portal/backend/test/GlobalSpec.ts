import {expect} from "chai";
import "mocha";

import Config, {ConfigCourses, ConfigKey} from "../../../common/Config";
import Log from "../../../common/Log";

import {DatabaseController} from "../src/controllers/DatabaseController";
import {Deliverable} from "../src/Types";
import Util from "../../../common/Util";

before(async () => {
    Log.info('GlobalSpec::before() - start');

    Config.getInstance();

    Config.getInstance().setProp(ConfigKey.name, ConfigCourses.classytest); // force testing env

    let db = DatabaseController.getInstance();
    await db.clearData(); // nuke everything

    Log.info('GlobalSpec::before() - done');
});

after(() => {
    Log.info('GlobalSpec::after()');
});

export class Test {

//    public static ORGNAME = "NOTSETYET"; // TODO: fix this

    public static readonly TEAMNAME1 = 'TESTteam1';
    public static readonly TEAMNAME2 = 'TESTteam2';

    public static readonly USERNAMEADMIN = 'ubcbot'; // should be admin on any test org
    public static readonly USERNAME1 = 'rthse2'; // real account for testing users
    public static readonly USERNAME2 = 'user2';
    public static readonly USERNAME3 = 'user3';

    public static readonly USERNAMEGITHUB1 = "cpscbot";
    public static readonly USERNAMEGITHUB2 = "rthse2";
    public static readonly USERNAMEGITHUB3 = "ubcbot";

    public static readonly DELIVID0 = 'd0';
    public static readonly DELIVID1 = 'd1';
    public static readonly DELIVID2 = 'd2';
    public static readonly DELIVID3 = 'd3';

    public static readonly REPONAME1 = 'TESTrepo1';
    public static readonly REPONAME2 = 'TESTrepo2';

    public static getDeliverable(delivId: string): Deliverable {
        let deliv: Deliverable = {
            id: delivId,

            URL:              'https://NOTSET',
            openTimestamp:    -1,
            closeTimestamp:   -1,
            gradesReleased:   false,
            // delay:            -1,
            teamMinSize:      1,
            teamMaxSize:      1,
            teamSameLab:      false,
            teamStudentsForm: false,
            teamPrefix:       'team_',
            repoPrefix:       '',
            // bootstrapUrl:     '',
            autotest:         {
                dockerImage:        'testImage',
                studentDelay:       60 * 60 * 12, // 12h
                maxExecTime:        300,
                regressionDelivIds: [],
                custom:             {}
            },
            custom:           {}
        };
        return <Deliverable>Util.clone(deliv);
    }
}