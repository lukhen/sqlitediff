import * as s from "better-sqlite3"
import { Database } from "better-sqlite3"

interface Diff {

}

const sqlitediff:
    (db1: s.Database, db2: s.Database) => Diff =
    (db1, db2) => ({})

describe("sqlitediff", () => {
    test("empty databases", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")
        expect(sqlitediff(db1, db2)).toEqual({})
    })
})
