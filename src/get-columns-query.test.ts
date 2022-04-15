import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { getColumns } from "./quries/tableColumns"


describe("get columns of a table query", () => {
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

    test("one column", () => {
        const db1 = new s.default(":memory:")
        db1.prepare(
            "CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 INTEGER, col3 INTEGER, col4 INTEGER, col5 INTEGER)").run()
        const cols = getColumns("table1")(db1)
        expect(cols).toEqual(E.right([
            { name: "col1" },
            { name: "col2" },
            { name: "col3" },
            { name: "col4" },
            { name: "col5" }
        ]))
    })

    test("one column, differe3nt table name", () => {
        const db1 = new s.default(":memory:")
        db1.prepare(
            "CREATE TABLE table2 (col1 INTEGER PRIMARY KEY, col2 INTEGER, col3 INTEGER, col4 INTEGER, col5 INTEGER)").run()
        const cols = getColumns("table2")(db1)
        expect(cols).toEqual(E.right([
            { name: "col1" },
            { name: "col2" },
            { name: "col3" },
            { name: "col4" },
            { name: "col5" }
        ]))
    })


})
