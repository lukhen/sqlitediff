import * as ts from "io-ts"
import { getQueryResult } from "../getQueryResult"

const tableCodec = ts.type({
    name: ts.string
})

const tablesCodec = ts.array(tableCodec)

interface Table {
    name: string
}

export const getTables = getQueryResult<Table>("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'")(tablesCodec)
