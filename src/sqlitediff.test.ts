import * as s from "better-sqlite3"
import { Database } from "better-sqlite3"
import * as A from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import * as IO from "fp-ts/lib/IO"
import * as O from "fp-ts/lib/Option"
import * as _ from "lodash"

interface Diff {
    tables_intersection: string[],
    tables_db1_db2: string[],
    tables_db2_db1: string[]
}

const getRows: (db: s.Database) => IO.IO<[string][]> =
    db => () => db.prepare(
        "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).raw().all() as [string][]

const sqlitediff:
    (db1: s.Database, db2: s.Database) => IO.IO<Diff> =
    (db1, db2) => {
        return pipe(
            IO.Do,
            IO.apS('db1Rows', getRows(db1)),
            IO.apS('db2Rows', getRows(db2)),
            IO.map(({ db1Rows, db2Rows }) => ({
                db1Tables: pipe(A.head(db1Rows), O.fold(() => [] as string[], row => row)),
                db2Tables: pipe(A.head(db2Rows), O.fold(() => [] as string[], row => row)),
            })),
            IO.map(({ db1Tables, db2Tables }) => (
                {
                    tables_db1_db2: _.difference(db1Tables, db2Tables),
                    tables_intersection: _.intersection(db1Tables, db2Tables),
                    tables_db2_db1: _.difference(db2Tables, db1Tables)
                }
            ))
        )

    }

describe("sqlitediff", () => {
    test("empty databases", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")
        expect(sqlitediff(db1, db2)()).toEqual({
            tables_db1_db2: [],
            tables_intersection: [],
            tables_db2_db1: []
        })
    })

    test("db1 has one empty table, db2 is empty", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        const db2 = new s.default(":memory:")

        expect(sqlitediff(db1, db2)()).toEqual({
            tables_db1_db2: ["User"],
            tables_intersection: [],
            tables_db2_db1: []
        })
    })


    test("Each db1 and db2 have one equal empty table", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        expect(sqlitediff(db1, db2)()).toEqual({
            tables_db1_db2: [],
            tables_intersection: ["User"],
            tables_db2_db1: []
        })
    })

    test("db2 has one empty table, db1 is empty", () => {
        const db1 = new s.default(":memory:")

        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        expect(sqlitediff(db1, db2)()).toEqual({
            tables_db1_db2: [],
            tables_intersection: [],
            tables_db2_db1: ["User"]
        })
    })



})
