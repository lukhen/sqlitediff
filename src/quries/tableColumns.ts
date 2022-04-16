import * as ts from "io-ts";
import { getQueryResult } from "../functions"
import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"
import { getTables } from "./dbtables"
import * as A from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function";

const columnCodec = ts.type({
    name: ts.string
})

const columnsCodec = ts.array(columnCodec)

interface Column {
    name: string
}

export const getColumns:
    (tableName: string) => (db: s.Database) => E.Either<ts.Errors, Column[]> =
    tableName => db => pipe(
        db,
        getTables,
        E.map(A.map(table => table.name)),
        E.map(tables => tables.includes(tableName)),
        E.chain(tableExists => tableExists ?
            getQueryResult<Column>(`SELECT name FROM PRAGMA_TABLE_INFO('${tableName}')`)(columnsCodec)(db) :
            E.left([{ value: {}, context: [], message: "no such table" }]))

    )
