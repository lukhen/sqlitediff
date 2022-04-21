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
            A.map(r => pipe(
                Object.entries(r),
                A.map(z => ({ colName: z[0], value: `${z[1]}` }))
            ))
        ))
    )


describe("getRows, multiple columns, multiple rows, different datatypes", () => {
    test("0 rows", () => {
        const db1 = new s.default(":memory:")
        db1.prepare(
            "CREATE TABLE table1 (col1 INTEGER PRIMARY KEY, col2 NULL, col3 REAL, col4 TEXT, col5 BLOB)"
        ).run()
        db1.prepare("INSERT INTO table1 VALUES (1, null, 2.345, 'multiline text', 'blob')").run()
        db1.prepare("INSERT INTO table1 VALUES (2, null, 5.678, 'multiline text', null)").run()
        db1.prepare("INSERT INTO table1 VALUES (3, null, 2.345, 'multiline text', 1)").run()
        db1.prepare("INSERT INTO table1 VALUES (4, null, 0.123, 'multiline text', 'blob')").run()
        db1.prepare("INSERT INTO table1 VALUES (5, null, -1000.00000001, 'multiline text', 2.34)").run()
        expect(getRows("table1", db1)).toEqual(E.right([
            [{ colName: "col1", value: "1" },
            { colName: "col2", value: "null" },
            { colName: "col3", value: "2.345" },
            { colName: "col4", value: "multiline text" },
            { colName: "col5", value: "blob" }],
            [{ colName: "col1", value: "2" },
            { colName: "col2", value: "null" },
            { colName: "col3", value: "5.678" },
            { colName: "col4", value: "multiline text" },
            { colName: "col5", value: "null" }],
            [{ colName: "col1", value: "3" },
            { colName: "col2", value: "null" },
            { colName: "col3", value: "2.345" },
            { colName: "col4", value: "multiline text" },
            { colName: "col5", value: "1" }],
            [{ colName: "col1", value: "4" },
            { colName: "col2", value: "null" },
            { colName: "col3", value: "0.123" },
            { colName: "col4", value: "multiline text" },
            { colName: "col5", value: "blob" }],
            [{ colName: "col1", value: "5" },
            { colName: "col2", value: "null" },
            { colName: "col3", value: "-1000.00000001" },
            { colName: "col4", value: "multiline text" },
            { colName: "col5", value: "2.34" }]
        ]))
    })
})

describe("getRows, 1 column table", () => {
    test("0 rows", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        expect(getRows("table1", db1)).toEqual(E.right([]))
    })

    test("1 row, 1 column", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db1.prepare("INSERT INTO table1 VALUES (1)").run()
        expect(getRows("table1", db1)).toEqual(E.right([[{ colName: "col1", value: "1" }]]))
    })

    test("2 rows, 1 column", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db1.prepare("INSERT INTO table1 VALUES (1)").run()
        db1.prepare("INSERT INTO table1 VALUES (2)").run()
        expect(getRows("table1", db1)).toEqual(
            E.right([
                [{ colName: "col1", value: "1" }],
                [{ colName: "col1", value: "2" }]
            ])
        )
    })

    test("5 rows, 1 column", () => {
        const db1 = new s.default(":memory:")
        db1.prepare("CREATE TABLE table1 (col1 INTEGER PRIMARY KEY)").run()
        db1.prepare("INSERT INTO table1 VALUES (1)").run()
        db1.prepare("INSERT INTO table1 VALUES (2)").run()
        db1.prepare("INSERT INTO table1 VALUES (3)").run()
        db1.prepare("INSERT INTO table1 VALUES (4)").run()
        db1.prepare("INSERT INTO table1 VALUES (5)").run()

        expect(getRows("table1", db1)).toEqual(
            E.right([
                [{ colName: "col1", value: "1" }],
                [{ colName: "col1", value: "2" }],
                [{ colName: "col1", value: "3" }],
                [{ colName: "col1", value: "4" }],
                [{ colName: "col1", value: "5" }]
            ])
        )
    })

})
