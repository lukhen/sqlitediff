import * as s from "better-sqlite3";
import { pipe } from "fp-ts/lib/function";
import * as ts from "io-ts";
import * as E from "fp-ts/lib/Either";
import * as IO from "fp-ts/lib/IO"
import * as A from "fp-ts/lib/Array";
import { Row } from "./types/Data";

interface Decoder<X> {
    decode: (x: any) => E.Either<ts.Errors, X>
}

export const getQueryResult:
    <Row>(query: string) => (decoder: Decoder<Row[]>) => (db: s.Database) => E.Either<ts.Errors, Row[]> =
    query => decoder => db => pipe(
        E.tryCatch(() => db.prepare(query).all(), (e) => [e as ts.ValidationError]),
        E.chain(decoder.decode)
    );

export const failTest: (msg: string) => IO.IO<void> =
    msg => () => { expect(msg).toEqual(0) } // always fails


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
