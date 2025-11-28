import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";

const DB_NAME = "fqhc.db";

// Singleton instance variable (lives across hook calls)
let databaseInstance: SQLite.SQLiteDatabase | undefined = undefined;
let databaseInitPromise: Promise<SQLite.SQLiteDatabase> | undefined = undefined;

const downloadDb = async (dbFile: File) => {
    try {
        console.log("Loading DB asset...");
        const asset = await Asset.loadAsync(
            require('../assets/database/fqhc.db')
        );

        const assetFile = new File(asset[0].localUri as string);

        // Copy DB asset to destination
        await assetFile.copy(dbFile);
        console.log("DB copied successfully.");
    } catch (error) {
        console.log("Error copying DB file:", error);
        throw error;
    }
};

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (databaseInstance) return databaseInstance;
    if (databaseInitPromise) return databaseInitPromise;

    databaseInitPromise = (async () => {
        try {
            const dbFile = new File(Paths.document, DB_NAME);

            // Load asset to get its expected size
            const asset = await Asset.loadAsync(
                require('../assets/database/fqhc.db')
            );
            const assetFile = new File(asset[0].localUri as string);
            const expectedSize = assetFile.size;

            let shouldDownload = false;

            if (!dbFile.exists || dbFile.size === 0) {
                console.log("DB file missing or empty. Will download.");
                shouldDownload = true;
            } else if (dbFile.size !== expectedSize) {
                console.log(
                    `DB file size mismatch: ${dbFile.size} vs expected ${expectedSize}. Redownloading.`
                );
                dbFile.delete();
                shouldDownload = true;
            } else {
                console.log("DB file exists and size matches:", dbFile.size);
            }

            if (shouldDownload) {
                await downloadDb(dbFile);
            }

            const db = await SQLite.openDatabaseAsync(
                DB_NAME,
                undefined,
                Paths.document.uri
            );
            databaseInstance = db;

            console.log("✅ Database initialized and ready", dbFile.size);
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
