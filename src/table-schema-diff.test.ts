import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { failTest } from "./functions"
import { pipe } from "fp-ts/lib/function"
import { sqliteTableSchemaDiff } from "./functions"

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
                    intersection: ["col1"],
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

    test("one table has one column more that the other, db1 > db2", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 INTEGER)").run()
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

                    intersection: ["col1"],
                    db1_db2: ["col2"],
                    db2_db1: []

                }))
            )
        )
    })

    test("one table has one column more that the other, db1 < db2", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 INTEGER)").run()
        const diff = sqliteTableSchemaDiff("table1", db1, db2)
        pipe(
            diff,
            E.fold(
                errors => {
                    failTest("this should not be reached")()
                },
                diff => (expect(diff).toEqual({

                    intersection: ["col1"],
                    db1_db2: [],
                    db2_db1: ["col2"]

                }))
            )
        )
    })

    test("multiple different columns", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 INTEGER, col3 INTEGER, col4 INTEGER, col5 INTEGER)").run()
        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE table1 (col4 INTEGER PRIMARY KEY, col5 INTEGER, col6 INTEGER, col7 INTEGER, col8 INTEGER)").run()
        const diff = sqliteTableSchemaDiff("table1", db1, db2)
        pipe(
            diff,
            E.fold(
                errors => {
                    failTest("this should not be reached")()
                },
                diff => (expect(diff).toEqual({

                    intersection: ["col4", "col5"],
                    db1_db2: ["col1", "col2", "col3"],
                    db2_db1: ["col6", "col7", "col8"]

                }))
            )
        )
    })


})
