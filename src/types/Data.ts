import * as Eq from "fp-ts/lib/Eq"
import { Eq as stringEq } from "fp-ts/lib/string";
import { getEq } from "fp-ts/lib/Array"

export interface Data {
    colName: string;
    value: string;
}

export type Row = Data[];

export const dataEq: Eq.Eq<Data> = Eq.struct({
    colName: stringEq,
    value: stringEq
})

export const rowEq = getEq(dataEq)
