import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { getColumns } from "./quries/tableColumns"
import { failTest } from "./functions"
import { pipe } from "fp-ts/lib/function"
import * as ts from "io-ts"
import * as _ from "lodash"
import * as A from "fp-ts/lib/Array"

interface TableSchemaDiff {
    intersection: string[],
    db1_db2: string[],
    db2_db1: string[]
}

const sqliteTableSchemaDiff:
    (tableName: string, db1: s.Database, db2: s.Database) => E.Either<ts.Errors, TableSchemaDiff> =
    (tableName, db1, db2) => {
        return pipe(
            E.Do,
            E.apS("db1Cols", getColumns(tableName)(db1)),
            E.apS("db2Cols", getColumns(tableName)(db2)),
            E.map(({ db1Cols, db2Cols }) => ({
                db1ColNames: pipe(db1Cols, A.map(col => col.name)),
                db2ColNames: pipe(db2Cols, A.map(col => col.name))
            })),
            E.map(({ db1ColNames, db2ColNames }) => ({
                intersection: [],
                db1_db2: _.difference(db1ColNames, db2ColNames),
                db2_db1: _.difference(db2ColNames, db1ColNames)
            }))
        )
    }

describe("sqliteTableSchemaDiff", () => {
    test("empty databases", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")

        const diff = sqliteTableSchemaDiff("table1", db1, db2)
        pipe(
            diff,
            E.fold(
                errors => {
                    expect(errors[0].message).toEqual("no such table")
                },
                diff => {
                    failTest("this should not be reached")()
                }
            )
        )
    })

    test("db1 empty, db2 not empty", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const diff = sqliteTableSchemaDiff("table1", db1, db2)
        pipe(
            diff,
            E.fold(
                errors => {
                    expect(errors[0].message).toEqual("no such table")
                },
                diff => {
                    failTest("this should not be reached")()
                }
            )
        )
    })

    test("db1 unempty, db2 empty", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const diff = sqliteTableSchemaDiff("table1", db1, db2)
        pipe(
            diff,
            E.fold(
                errors => {
                    expect(errors[0].message).toEqual("no such table")
                },
                diff => {
                    failTest("this should not be reached")()
                }
            )
        )
    })

    test("databases have the table, both tables have one the same column", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const diff = sqliteTableSchemaDiff("table1", db1, db2)
        pipe(
            diff,
            E.fold(
                errors => {
                    failTest("this should not be reached")()
                },
                diff => (expect(diff).toEqual({
                    intersection: [],
                    db1_db2: [],
                    db2_db1: []

                }))
            )
        )
    })

    test("both tables have each single different columns", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col2 INTEGER PRIMARY KEY)").run()
        const diff = sqliteTableSchemaDiff("table1", db1, db2)
        pipe(
            diff,
            E.fold(
                errors => {
                    failTest("this should not be reached")()
                },
                diff => (expect(diff).toEqual({

                    intersection: [],
                    db1_db2: ["col1"],
                    db2_db1: ["col2"]

                }))
            )
        )
    })
})
