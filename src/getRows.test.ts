import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import * as ts from "io-ts"

interface Data {
    colName: string,
    value: string
}

type Row = Data[]

// !!!
const getRows:
    (tableName: string, db: s.Database) => E.Either<ts.Errors, Row[]> =
    (tableName, db) => E.right([])


describe("getRows", () => {
    test("0 rows", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 INTEGER)").run()
        expect(getRows("table1", db1)).toEqual(E.right([]))
    })
})
