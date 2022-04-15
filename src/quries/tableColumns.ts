import * as ts from "io-ts";
import { getQueryResult } from "../functions"
import * as s from "better-sqlite3"
import * as E from "fp-ts/lib/Either"

const columnCodec = ts.type({
    name: ts.string
})

const columnsCodec = ts.array(columnCodec)

interface Column {
    name: string
}

export const getColumns:
    (tableName: string) => (db: s.Database) => E.Either<ts.Errors, Column[]> =
    tableName => getQueryResult<Column>(`SELECT name FROM PRAGMA_TABLE_INFO('${tableName}')`)(columnsCodec)
