import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";

const DB_NAME = "fqhc.db";

//Singleton instance variable (lives across hook calls)
let databaseInstance: SQLite.SQLiteDatabase | undefined = undefined;
let databaseInitPromise: Promise<SQLite.SQLiteDatabase> | undefined = undefined;

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
    // If already initialized, just return it
    if (databaseInstance) return databaseInstance;

    // If initialization is already in progress, wait for it
    if (databaseInitPromise) return databaseInitPromise;

    databaseInitPromise = (async () => {
        try {

            // Destination: app's document directory
            const dbFile = new File(Paths.document, DB_NAME);

            // Copy DB if it doesn’t exist
            if (!dbFile.exists) {
                try {
                    // Load the DB asset
                    const asset = Asset.fromModule(
                        require(`../assets/database/${DB_NAME}`)
                    );
                    await asset.downloadAsync().catch((err) => {
                        console.error("Failed to download DB asset:", err);
                        throw err;
                    });
                    const assetFile = new File(asset.localUri!);
                    await assetFile.copy(dbFile);
                } catch (error) {
                    console.log("Error copying DB file:", error);
                }
            } else {
                console.log("DB file already exists at", dbFile.uri);
            }

            // Open the SQLite database
            const db = await SQLite.openDatabaseAsync(
                DB_NAME,
                undefined,
                Paths.document.uri
            );
            databaseInstance = db;

            console.log("✅ Database initialized and ready");
            return db;
        } catch (error) {
            console.log("Error initializing DB:", error);
            throw error;
        }
    })();

    return databaseInitPromise;
}

export default function useDatabase() {
    const [db, setDb] = useState<SQLite.SQLiteDatabase | undefined>(
        databaseInstance
    );
    const [loading, setLoading] = useState(db === undefined);

    useEffect(() => {
        initializeDatabase()
            .then((database) => {
                setDb(database);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error setting up database:", error);
            });
    }, []);

    const query = async (sql: string, params: any[] = []) => {
        if (!db) throw new Error("Database not initialized yet.");
        try {
            const result = await db.getAllAsync(sql, params);
            return result;
        } catch (error) {
            console.error("SQL query error:", error);
            throw error;
        }
    };

    return { db, loading, query };
}
