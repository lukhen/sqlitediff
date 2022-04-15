import * as s from "better-sqlite3";
import { pipe } from "fp-ts/lib/function";
import * as ts from "io-ts";
import * as E from "fp-ts/lib/Either";
import * as IO from "fp-ts/lib/IO"

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

