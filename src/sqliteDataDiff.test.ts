import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { getColumns } from "./quries/tableColumns"
import { failTest } from "./functions"
import { pipe } from "fp-ts/lib/function"
import * as ts from "io-ts"
import * as _ from "lodash"
import * as A from "fp-ts/lib/Array"

interface DataDiff { }

const sqliteDataDiff:
    (tableName: string, db1: s.Database, db2: s.Database) => E.Either<ts.Errors, DataDiff> =
    (tableName, db1, db2) => E.left([{ value: {}, context: [], message: "no such table" }])


describe("sqliteDataDiff", () => {
    test("no such table in both databases", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")

        const diff = sqliteDataDiff("table1", db1, db2)

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


})
