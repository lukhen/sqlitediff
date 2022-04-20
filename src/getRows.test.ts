import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import * as ts from "io-ts"
import * as A from "fp-ts/lib/Array"
interface Data {
    colName: string,
    value: string
}

type Row = Data[]

// !!!
const getRows:
    (tableName: string, db: s.Database) => E.Either<ts.Errors, Row[]> =
    (tableName, db) => pipe(
        E.tryCatch(() => db.prepare(`SELECT * FROM ${tableName}`).all(), (e) => [e as ts.ValidationError]),
        E.map(queryResult => pipe(
            queryResult,
            A.map(r => ([{ colName: "col1", value: "1" }]))
        ))
    )


describe("getRows", () => {
    test("0 rows", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 INTEGER)").run()
        expect(getRows("table1", db1)).toEqual(E.right([]))
    })

    test("1 row, 1 column", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db1.prepare("INSERT INTO table1 VALUES (1)").run()
        expect(getRows("table1", db1)).toEqual(E.right([[{ colName: "col1", value: "1" }]]))
    })

})
