import * as s from "better-sqlite3";
import { pipe } from "fp-ts/lib/function";
import * as ts from "io-ts";
import * as E from "fp-ts/lib/Either";
import * as IO from "fp-ts/lib/IO"
import * as A from "fp-ts/lib/Array";
import { Row, rowEq } from "./types/Data";
import { DataDiff } from "./types/DataDiff"
import { getTables } from "./quries/dbtables";
import { SchemaDiff } from "./types/SchemaDiff";
import * as _ from "lodash";
import { TableSchemaDiff } from "./types/TableSchemaDiff";
import { getColumns } from "./quries/tableColumns";

export interface Decoder<X> {
    decode: (x: any) => E.Either<ts.Errors, X>
}

export const failTest: (msg: string) => IO.IO<void> =
    msg => () => { expect(msg).toEqual(0) } // always fails


// REFACTOR: possible srp violation, should be 2 functions
export const getRows: (tableName: string, db: s.Database) => E.Either<ts.Errors, Row[]> = (tableName, db) => pipe(
    E.tryCatch(() => db.prepare(`SELECT * FROM ${tableName}`).all(), (e) => [e as ts.ValidationError]),
    E.map(queryResult => pipe(
        queryResult,
        A.map(r => pipe(
            Object.entries(r),
            A.map(z => ({ colName: z[0], value: `${z[1]}` }))
        ))
    ))
);

export const sqliteDataDiff: (tableName: string, db1: s.Database, db2: s.Database) => E.Either<ts.Errors, DataDiff> = (tableName, db1, db2) => pipe(
    E.Do,
    E.apS("db1Rows", getRows(tableName, db1)),
    E.apS("db2Rows", getRows(tableName, db2)),
    E.map(({ db1Rows, db2Rows }) => ({
        db1_db2: A.difference(rowEq)(db2Rows)(db1Rows),
        db2_db1: A.difference(rowEq)(db1Rows)(db2Rows),
        intersection: A.intersection(rowEq)(db1Rows)(db2Rows)
    }))

);

export const sqliteSchemaDiff: (db1: s.Database, db2: s.Database) => E.Either<ts.Errors, SchemaDiff> = (db1, db2) => {
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

    );
};

export const sqliteTableSchemaDiff: (tableName: string, db1: s.Database, db2: s.Database) => E.Either<ts.Errors, TableSchemaDiff> = (tableName, db1, db2) => {
    return pipe(
        E.Do,
        E.apS("db1Cols", getColumns(tableName)(db1)),
        E.apS("db2Cols", getColumns(tableName)(db2)),
        E.map(({ db1Cols, db2Cols }) => ({
            db1ColNames: pipe(db1Cols, A.map(col => col.name)),
            db2ColNames: pipe(db2Cols, A.map(col => col.name))
        })),
        E.map(({ db1ColNames, db2ColNames }) => ({
            intersection: _.intersection(db1ColNames, db2ColNames),
            db1_db2: _.difference(db1ColNames, db2ColNames),
            db2_db1: _.difference(db2ColNames, db1ColNames)
        }))
    );
};
