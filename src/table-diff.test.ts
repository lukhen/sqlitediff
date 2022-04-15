import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import * as ts from "io-ts";
import * as _ from "lodash"
import { getQueryResult } from "./functions"

const columnCodec = ts.type({
    name: ts.string
})

const columnsCodec = ts.array(columnCodec)

interface Column {
    name: string
}

const getColumns:
    (tableName: string) => (db: s.Database) => E.Either<ts.Errors, Column[]> =
    tableName => getQueryResult<Column>("SELECT name FROM PRAGMA_TABLE_INFO('table1')")(columnsCodec)


describe("", () => {
    test("no such table", () => {
        const db1 = new s.default(":memory:")
        const cols = getColumns("table1")(db1)
        expect(cols).toEqual(E.right([]))
    })

    test("one column", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (id INTEGER PRIMARY KEY)").run()
        const cols = getColumns("table1")(db1)
        expect(cols).toEqual(E.right([{ name: "id" }]))
    })


})
