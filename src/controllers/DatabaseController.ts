import {Collection, Db, MongoClient} from "mongodb";

import {Deliverable, Grade, Person, Repository, Team} from "../Types";
import Log from "../util/Log";
import Util from "../util/Util";
import {Config} from "../Config";


export class DatabaseController {

    private static instance: DatabaseController = null;
    private db: Db = null;

    private readonly PERSONCOLL = 'people';
    private readonly GRADECOLL = 'grades';
    private readonly TEAMCOLL = 'teams';
    private readonly DELIVCOLL = 'deliverables';
    private readonly REPOCOLL = 'repositories';

    /**
     * use getInstance() instead.
     */
    private constructor() {
        Log.info("DatabaseController::<init> - creating new controller");
    }

    /**
     * Returns the current controller; shares Mongo connections.
     *
     * @returns {DatabaseController}
     */
    public static getInstance() {
        if (DatabaseController.instance === null) {
            DatabaseController.instance = new DatabaseController();
        }
        return DatabaseController.instance;
    }

    public async getPerson(orgName: string, recordId: string): Promise<Person | null> {
        Log.info("DatabaseController::getPerson( " + orgName + ", " + recordId + " ) - start");
        return <Person> await this.readSingleRecord(this.PERSONCOLL, {"org": orgName, "id": recordId});
    }

    public async getRepository(orgName: string, recordId: string): Promise<Repository | null> {
        Log.info("DatabaseController::getRepository( " + orgName + ", " + recordId + " ) - start");
        return <Repository> await this.readSingleRecord(this.REPOCOLL, {"org": orgName, "id": recordId});
    }

    public async getTeam(orgName: string, recordId: string): Promise<Team | null> {
        Log.info("DatabaseController::getTeam( " + orgName + ", " + recordId + " ) - start");
        return <Team> await this.readSingleRecord(this.TEAMCOLL, {"org": orgName, "id": recordId});
    }

    public async getRepositories(orgName: string): Promise<Repository[]> {
        Log.info("DatabaseController::getRepositories( " + orgName + " ) - start");
        return <Repository[]> await this.readRecords(this.REPOCOLL, {"org": orgName});
    }

    public async getTeams(orgName: string): Promise<Team[]> {
        Log.info("DatabaseController::getTeams( " + orgName + " ) - start");
        return <Team[]> await this.readRecords(this.TEAMCOLL, {"org": orgName});
    }

    public async getPeople(orgName: string): Promise<Person[]> {
        Log.info("DatabaseController::getPeople( " + orgName + " ) - start");
        return <Person[]> await this.readRecords(this.PERSONCOLL, {"org": orgName});
    }

    public async getDeliverables(orgName: string): Promise<Deliverable[]> {
        Log.info("DatabaseController::getDeliverables( " + orgName + " ) - start");
        return <Deliverable[]> await this.readRecords(this.DELIVCOLL, {"org": orgName});
    }

    public async getGrades(orgName: string): Promise<Grade[]> {
        Log.info("DatabaseController::getGrades( " + orgName + " ) - start");
        return <Grade[]> await this.readRecords(this.GRADECOLL, {"org": orgName});
    }

    public async writePerson(record: Person): Promise<boolean> {
        Log.info("DatabaseController::writePerson(..) - start");
        return await this.writeRecord(this.PERSONCOLL, record);
    }

    public async writeTeam(record: Team): Promise<boolean> {
        Log.info("DatabaseController::writeTeam(..) - start");
        return await this.writeRecord(this.TEAMCOLL, record);
    }

    public async writeDeliverable(record: Deliverable): Promise<boolean> {
        Log.info("DatabaseController::writeDeliverable(..) - start");
        return await this.writeRecord(this.DELIVCOLL, record);
    }

    public async writeGrade(record: Team): Promise<boolean> {
        Log.info("DatabaseController::writeGrade(..) - start");
        return await this.writeRecord(this.GRADECOLL, record);
    }

    public async writeRepository(record: Repository): Promise<boolean> {
        Log.info("DatabaseController::writeRepository(..) - start");
        return await this.writeRecord(this.REPOCOLL, record);
    }

    public async writeRecord(colName: string, record: {}): Promise<boolean> {
        Log.info("DatabaseController::writeRecord( " + colName + ", ...) - start");
        Log.trace("DatabaseController::writeRecord(..) - record: " + JSON.stringify(record));
        try {
            const collection = await this.getCollection(colName);
            const copy = Object.assign({}, record);
            await collection.insertOne(copy);
            Log.trace("DatabaseController::writeRecord(..) - write complete");
            return true;
        } catch (err) {
            Log.error("DatabaseController::writeRecord(..) - ERROR: " + err);
            return false;
        }
    }

    /**
     * Returns a ready-to-use `collection` object from MongoDB.
     *
     * Usage:
     *
     *   (await getCollection('users')).find().toArray().then( ... )
     */
    public async getCollection(collectionName: string): Promise<Collection> {
        const db = await this.open();
        return db.collection(collectionName);
    }

    public async clearData(): Promise<void> {
        Log.warn("DatabaseController::clearData() - start (WARNING: ONLY USE THIS FOR DEBUGGING!)");
        const configName = Config.getInstance().getProp("name");
        if (configName === "test" || configName === "secapstonetest") {
            let cols = [this.PERSONCOLL, this.GRADECOLL, this.TEAMCOLL, this.DELIVCOLL, this.REPOCOLL];
            for (const col of cols) {
                Log.info("DatabaseController::clearData() - removing data for collection: " + col);
                const collection = await this.getCollection(col);
                await collection.deleteMany({});
            }
            Log.info("DatabaseController::clearData() - files removed");
        } else {
            throw new Error("DatabaseController::clearData() - can only be called on test configurations");
        }
        return;
    }

    private async readSingleRecord(column: string, query: {} | null): Promise<{} | null> {
        try {
            Log.trace("DatabaseController::readSingleRecord( " + column + ", " + JSON.stringify(query) + " ) - start");
            const start = Date.now();
            let col = await this.getCollection(column);
            if (query === null) {
                query = {};
            }
            //if (typeof key !== 'undefined' && key !== null && typeof value !== 'undefined' && value !== null) {
            //    query[key] = value;
            // }
            const records: any[] = await <any>col.find(query).toArray();
            if (records === null || records.length === 0) {
                Log.trace("DatabaseController::readSingleRecord(..) - done; no records found; took: " + Util.took(start));
                return null;
            } else {
                Log.trace("DatabaseController::readSingleRecord(..) - done; # records: " + records.length + "; took: " + Util.took(start));
                let record = records[0];
                delete record._id; // remove the record id, just so we can't use it
                return record;
            }
        } catch (err) {
            Log.error("DatabaseController::readSingleRecord(..) - ERROR: " + err);
        }
        return null;
    }

    private async readRecords(column: string, query: {} | null): Promise<{}[]> {
        try {
            Log.trace("DatabaseController::readRecords( " + column + ", " + JSON.stringify(query) + " ) - start");
            const start = Date.now();
            let col = await this.getCollection(column);
            if (query === null) {
                query = {};
            }
            const records: any[] = await <any>col.find(query).toArray();
            if (records === null || records.length === 0) {
                Log.trace("DatabaseController::readRecords(..) - done; no records found. took: " + Util.took(start));
                return [];
            } else {
                Log.trace("DatabaseController::readRecords(..) - done; # records: " + records.length + ". took: " + Util.took(start));
                for (const r of records) {
                    delete r._id;// remove the record id, just so we can't use it
                }
                return records;
            }
        } catch (err) {
            Log.error("DatabaseController::readRecords(..) - ERROR: " + err);
        }
        return [];
    }

    /**
     * Internal use only, do not use this method; use getCollection(..) instead.
     *
     * @returns {Promise<Db>}
     */
    private async open(): Promise<Db> {
        // Log.trace("DatabaseController::open() - start");
        if (this.db === null) {
            const dbName = Config.getInstance().getProp('dbName');
            Log.info("DatabaseController::open() - db null; making new connection to: " + dbName);

            const client = await MongoClient.connect('mongodb://localhost:27017');
            this.db = await client.db(dbName);

            Log.info("DatabaseController::open() - db null; new connection made");
        }
        // Log.trace("DatabaseController::open() - returning db");
        return this.db;
    }

}

