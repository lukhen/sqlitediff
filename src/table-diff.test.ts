import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import * as ts from "io-ts";
import * as _ from "lodash"

const getColumns:
    (db: s.Database, tableName: string) => E.Either<ts.Errors, string[]> =
    (db, tableName) => E.left([{ value: "", context: [], message: "no such table" }])


describe("", () => {
    test("no such table", () => {
        const db1 = new s.default(":memory:")
        const cols = getColumns(db1, "table1")
        expect(cols).toEqual(E.left([{ value: "", context: [], message: "no such table" }]))
    })

})
