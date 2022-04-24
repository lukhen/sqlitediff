import * as s from "better-sqlite3";
import { pipe } from "fp-ts/lib/function";
import * as ts from "io-ts";
import * as E from "fp-ts/lib/Either";
import { Decoder } from "./functions";


export const getQueryResult: <A>(query: string) => (decoder: Decoder<A[]>) => (db: s.Database) => E.Either<ts.Errors, A[]> =
    query => decoder => db => pipe(
        E.tryCatch(() => db.prepare(query).all(), (e) => [e as ts.ValidationError]),
        E.chain(decoder.decode)
    );
