import * as s from "better-sqlite3"
import { Database } from "better-sqlite3"

interface Diff {
    tables_intersection: string[],
    tables_db1_db2: string[],
    tables_db2_db1: string[]
}

const sqlitediff:
    (db1: s.Database, db2: s.Database) => Diff =
    (db1, db2) => {
        const db1_tables = db1.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").raw().all()
        return {
            tables_db1_db2: db1_tables.map(x => x[0]),
            tables_intersection: [],
            tables_db2_db1: []
        }
    }

describe("sqlitediff", () => {
    test("empty databases", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")
        expect(sqlitediff(db1, db2)).toEqual({
            tables_db1_db2: [],
            tables_intersection: [],
            tables_db2_db1: []
        })
    })

    test("db1 has one empty table, db2 is empty", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        const db2 = new s.default(":memory:")

        expect(sqlitediff(db1, db2)).toEqual({
            tables_db1_db2: ["User"],
            tables_intersection: [],
            tables_db2_db1: []
        })
    })

})
