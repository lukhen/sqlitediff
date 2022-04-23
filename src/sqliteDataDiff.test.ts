import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { getColumns } from "./quries/tableColumns"
import { failTest } from "./functions"
import { pipe } from "fp-ts/lib/function"
import * as ts from "io-ts"
import * as _ from "lodash"
import * as A from "fp-ts/lib/Array"
import { sequenceT } from "fp-ts/lib/Apply"
import { getRows } from "./functions"
import { Row, rowEq } from "./types/Data"

interface DataDiff {
    db1_db2: Row[]
    db2_db1: Row[]
    intersection: Row[]
}

/*
ASSUME: getColumns(tableName)(db1) == getColumns(tableName)(db2)
*/
const sqliteDataDiff:
    (tableName: string, db1: s.Database, db2: s.Database) => E.Either<ts.Errors, DataDiff> =
    (tableName, db1, db2) => pipe(
        E.Do,
        E.apS("db1Rows", getRows(tableName, db1)),
        E.apS("db2Rows", getRows(tableName, db2)),
        E.map(({ db1Rows, db2Rows }) => ({
            db1_db2: A.difference(rowEq)(db2Rows)(db1Rows),
            db2_db1: A.difference(rowEq)(db1Rows)(db2Rows),
            intersection: A.intersection(rowEq)(db1Rows)(db2Rows)
        }))

    )

describe("sqliteDataDiff, no such table", () => {
    test("in both databases", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")

        const diff = sqliteDataDiff("table1", db1, db2)

        pipe(
            diff,
            E.fold(
                errors => {
                    expect(errors[0].message).toEqual("no such table: table1")
                },
                diff => {
                    failTest("this should not be reached")()
                }
            )
        )
    })

    test("in db2", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const db2 = new s.default(":memory:")

        const diff = sqliteDataDiff("table1", db1, db2)

        pipe(
            diff,
            E.fold(
                errors => {
                    expect(errors[0].message).toEqual("no such table: table1")
                },
                diff => {
                    failTest("this should not be reached")()
                }
            )
        )
    })

    test("in db1", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()

        const diff = sqliteDataDiff("table1", db1, db2)

        pipe(
            diff,
            E.fold(
                errors => {
                    expect(errors[0].message).toEqual("no such table: table1")
                },
                diff => {
                    failTest("this should not be reached")()
                }
            )
        )
    })
})

describe("single equal columns in both databases", () => {

    test("no data (rows)", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()

        const diff = sqliteDataDiff("table1", db1, db2)

        pipe(
            diff,
            E.fold(
                errors => {
                    failTest("this should not be reached")()
                },
                diff => {
                    expect(diff).toEqual({
                        db1_db2: [],
                        db2_db1: [],
                        intersection: []
                    })

                }
            )
        )
    })

    test("one row in db1", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db1.prepare("INSERT INTO table1 VALUES (0)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()

        pipe(
            E.Do,
            E.apS("diff", sqliteDataDiff("table1", db1, db2)),
            E.apS("rows", getRows("table1", db1)),
            E.fold(
                errors => { failTest("this should not be reached")() },
                ({ diff, rows }) => {
                    expect(diff).toEqual({
                        db1_db2: rows,
                        db2_db1: [],
                        intersection: []
                    })
                }
            )
        )
    })


    test("one row in db1", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db2.prepare("INSERT INTO table1 VALUES (0)").run()

        pipe(
            E.Do,
            E.apS("diff", sqliteDataDiff("table1", db1, db2)),
            E.apS("rows", getRows("table1", db2)),
            E.fold(
                errors => { failTest("this should not be reached")() },
                ({ diff, rows }) => {
                    expect(diff).toEqual({
                        db1_db2: [],
                        db2_db1: rows,
                        intersection: []
                    })
                }
            )
        )
    })

    test("one row in each db, rows are equal", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db1.prepare("INSERT INTO table1 VALUES (0)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db2.prepare("INSERT INTO table1 VALUES (0)").run()

        pipe(
            E.Do,
            E.apS("diff", sqliteDataDiff("table1", db1, db2)),
            E.apS("rows", getRows("table1", db1)),
            E.fold(
                errors => { failTest("this should not be reached")() },
                ({ diff, rows }) => {
                    expect(diff).toEqual({
                        db1_db2: [],
                        db2_db1: [],
                        intersection: rows
                    })
                }
            )
        )
    })

    test("one row in each db, rows are not equal", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db1.prepare("INSERT INTO table1 VALUES (0)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db2.prepare("INSERT INTO table1 VALUES (1)").run()

        pipe(
            E.Do,
            E.apS("diff", sqliteDataDiff("table1", db1, db2)),
            E.apS("db1Rows", getRows("table1", db1)),
            E.apS("db2Rows", getRows("table1", db2)),
            E.fold(
                errors => { failTest("this should not be reached")() },
                ({ diff, db1Rows, db2Rows }) => {
                    expect(diff).toEqual({
                        db1_db2: db1Rows,
                        db2_db1: db2Rows,
                        intersection: []
                    })
                }
            )
        )
    })


    test("multiple rows, multiple different type columns", () => {
        const db1 = new s.default(":memory:")
        db1.prepare(
            "CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 NULL, col3 REAL, col4 TEXT, col5 BLOB)"
        ).run()
        db1.prepare("INSERT INTO table1 VALUES (999, null, 2.345, 'multiline text', 'blob')").run()
        db1.prepare("INSERT INTO table1 VALUES (2, null, 5.678, 'multiline text', null)").run()
        db1.prepare("INSERT INTO table1 VALUES (3, null, 2.345, 'multiline text', 1)").run()
        db1.prepare("INSERT INTO table1 VALUES (4, null, 0.123, 'multiline text', 'blob')").run()
        db1.prepare("INSERT INTO table1 VALUES (5, null, -1000.00000001, 'multiline text', 2.34)").run()


        const db2 = new s.default(":memory:")

        db2.prepare(
            "CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 NULL, col3 REAL, col4 TEXT, col5 BLOB)"
        ).run()
        db2.prepare("INSERT INTO table1 VALUES (1, null, 2.345, 'multiline text', 'blob')").run()
        db2.prepare("INSERT INTO table1 VALUES (2, null, 5.678, 'multiline text', null)").run()
        db2.prepare("INSERT INTO table1 VALUES (3, null, 2.345, 'multiline text', 1)").run()
        db2.prepare("INSERT INTO table1 VALUES (4, null, 0.123, 'multiline text', 'blob')").run()
        db2.prepare("INSERT INTO table1 VALUES (5, null, -1000.00000002, 'multiline text', 2.34)").run()

        pipe(
            E.Do,
            E.apS("diff", sqliteDataDiff("table1", db1, db2)),
            E.apS("db1Rows", getRows("table1", db1)),
            E.apS("db2Rows", getRows("table1", db2)),
            E.fold(
                errors => { failTest("this should not be reached")() },
                ({ diff, db1Rows, db2Rows }) => {
                    expect(diff).toEqual({
                        db1_db2: [db1Rows[3], db1Rows[4]],
                        db2_db1: [db2Rows[0], db2Rows[4]],
                        intersection: [db1Rows[0], db1Rows[1], db1Rows[2]]
                    })
                }
            )
        )
    })

    test("multiple different rows, change in the middle", () => {
        const db1 = new s.default(":memory:")
        db1.prepare(
            "CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 NULL, col3 REAL, col4 TEXT, col5 BLOB)"
        ).run()
        db1.prepare("INSERT INTO table1 VALUES (1, null, 2.345, 'multiline text', 'blob')").run()
        db1.prepare("INSERT INTO table1 VALUES (2, null, 5.678, 'multiline text', null)").run()
        db1.prepare("INSERT INTO table1 VALUES (4, null, 2.345, 'multiline text', 1)").run()
        db1.prepare("INSERT INTO table1 VALUES (5, null, 0.123, 'multiline text', 'blob')").run()

        const db2 = new s.default(":memory:")

        db2.prepare(
            "CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 NULL, col3 REAL, col4 TEXT, col5 BLOB)"
        ).run()
        db2.prepare("INSERT INTO table1 VALUES (1, null, 2.345, 'multiline text', 'blob')").run()
        db2.prepare("INSERT INTO table1 VALUES (2, null, 5.678, 'multiline text', null)").run()
        db2.prepare("INSERT INTO table1 VALUES (3, null, -1000.00000002, 'multiline text', 2.34)").run()
        db2.prepare("INSERT INTO table1 VALUES (4, null, 2.345, 'multiline text', 1)").run()
        db2.prepare("INSERT INTO table1 VALUES (5, null, 0.123, 'multiline text', 'blob')").run()

        pipe(
            E.Do,
            E.apS("diff", sqliteDataDiff("table1", db1, db2)),
            E.apS("db1Rows", getRows("table1", db1)),
            E.apS("db2Rows", getRows("table1", db2)),
            E.fold(
                errors => { failTest("this should not be reached")() },
                ({ diff, db1Rows, db2Rows }) => {
                    expect(diff).toEqual({
                        db1_db2: [],
                        db2_db1: [db2Rows[2]],
                        intersection: db1Rows
                    })
                }
            )
        )
    })

})
