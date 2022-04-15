import * as s from "better-sqlite3"
import { pipe } from "fp-ts/lib/function"
import * as E from "fp-ts/lib/Either"
import { failTest } from "./functions"
import { getTables } from "./quries/dbtables"
import { SchemaDiff } from "./types/SchemaDiff"
import * as A from "fp-ts/lib/Array"
import * as ts from "io-ts";
import * as _ from "lodash"

export const sqliteSchemaDiff:
    (db1: s.Database, db2: s.Database) => E.Either<ts.Errors, SchemaDiff> =
    (db1, db2) => {
        return pipe(
            E.Do,
            E.apS('db1Tables', getTables(db1)),
            E.apS('db2Tables', getTables(db2)),
            E.map(({ db1Tables, db2Tables }) => ({
                db1TableNames: pipe(db1Tables, A.map(table => table.name)),
                db2TableNames: pipe(db2Tables, A.map(table => table.name))
            })),
            E.map(({ db1TableNames, db2TableNames }) => (
                {
                    tables_db1_db2: _.difference(db1TableNames, db2TableNames),
                    tables_intersection: _.intersection(db1TableNames, db2TableNames),
                    tables_db2_db1: _.difference(db2TableNames, db1TableNames)
                }
            ))

        )
    }


describe("sqliteSchemaDiff", () => {
    test("empty databases", () => {
        const db1 = new s.default(":memory:")
        const db2 = new s.default(":memory:")

        const diff = sqliteSchemaDiff(db1, db2)
        pipe(
            diff,
            E.fold(
                errors => { failTest },
                diff => {
                    expect(diff).toEqual({
                        tables_db1_db2: [],
                        tables_intersection: [],
                        tables_db2_db1: []
                    })
                }
            )
        )
    })



    test("db1 has one empty table, db2 is empty", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        const db2 = new s.default(":memory:")

        const diff = sqliteSchemaDiff(db1, db2)
        pipe(
            diff,
            E.fold(
                errors => { failTest },
                diff => {
                    expect(diff).toEqual({
                        tables_db1_db2: ["User"],
                        tables_intersection: [],
                        tables_db2_db1: []
                    })

                }
            )
        )
    })


    test("Each db1 and db2 have one equal empty table", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        const diff = sqliteSchemaDiff(db1, db2)
        pipe(
            diff,
            E.fold(
                errors => { failTest },
                diff => {
                    expect(diff).toEqual({
                        tables_db1_db2: [],
                        tables_intersection: ["User"],
                        tables_db2_db1: []
                    })

                }
            )
        )
    })

    test("db2 has one empty table, db1 is empty", () => {
        const db1 = new s.default(":memory:")

        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()

        const diff = sqliteSchemaDiff(db1, db2)
        pipe(
            diff,
            E.fold(
                errors => { failTest },
                diff => {
                    expect(diff).toEqual({
                        tables_db1_db2: [],
                        tables_intersection: [],
                        tables_db2_db1: ["User"]
                    })
                }
            )
        )
    })


    test("multiple tables", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE Table1 (id INTEGER PRIMARY KEY)").run()
        db1.prepare("CREATE TABLE Table2 (id INTEGER PRIMARY KEY)").run()
        db1.prepare("CREATE TABLE Table3 (id INTEGER PRIMARY KEY)").run()
        db1.prepare("CREATE TABLE Table4 (id INTEGER PRIMARY KEY)").run()
        db1.prepare("CREATE TABLE Table5 (id INTEGER PRIMARY KEY)").run()


        const db2 = new s.default(":memory:")
        db2.prepare("CREATE TABLE Table4 (id INTEGER PRIMARY KEY)").run()
        db2.prepare("CREATE TABLE Table5 (id INTEGER PRIMARY KEY)").run()
        db2.prepare("CREATE TABLE Table6 (id INTEGER PRIMARY KEY)").run()
        db2.prepare("CREATE TABLE Table7 (id INTEGER PRIMARY KEY)").run()
        db2.prepare("CREATE TABLE Table8 (id INTEGER PRIMARY KEY)").run()

        const diff = sqliteSchemaDiff(db1, db2)
        pipe(
            diff,
            E.fold(
                errors => { failTest },
                diff => {
                    expect(diff).toEqual({
                        tables_db1_db2: ["Table1", "Table2", "Table3"],
                        tables_intersection: ["Table4", "Table5"],
                        tables_db2_db1: ["Table6", "Table7", "Table8"]
                    })

                }
            )
        )
    })


})


describe("getRowsTypeSafe", () => {
    test("", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE User (userid INTEGER PRIMARY KEY)").run()
        const rows = getTables(db1)
        pipe(
            rows,
            E.fold(
                errors => { failTest },
                rows => { expect(rows).toEqual([{ name: "User" }]) }
            )
        )

    })
})
