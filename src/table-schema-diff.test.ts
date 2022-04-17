import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { getColumns } from "./quries/tableColumns"
import { failTest } from "./functions"
import { pipe } from "fp-ts/lib/function"
import * as ts from "io-ts"

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
                intersection: [],
                db1_db2: [],
                db2_db1: []
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
                diff => ({

                    intersection: [],
                    db1_db2: [],
                    db2_db1: []

                })
            )
        )
    })

})
