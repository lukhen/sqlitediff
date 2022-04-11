import * as s from "better-sqlite3"
import { Database } from "better-sqlite3"
import * as A from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import * as IO from "fp-ts/lib/IO"

interface Diff {
    tables_intersection: string[],
    tables_db1_db2: string[],
    tables_db2_db1: string[]
}

const getTables: (db: s.Database) => IO.IO<[string][]> =
    db => () => db.prepare(
        "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).raw().all() as [string][]

const sqlitediff:
    (db1: s.Database, db2: s.Database) => Diff =
    (db1, db2) => {
        return pipe(
            getTables(db1)(),
            A.map(rawRow => rawRow[0]),
            tableName => ({
                tables_db1_db2: tableName,
                tables_intersection: [],
                tables_db2_db1: []
            })
        )

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
