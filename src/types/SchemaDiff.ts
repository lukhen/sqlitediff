export  interface SchemaDiff {
    tables_intersection: string[],
    tables_db1_db2: string[],
    tables_db2_db1: string[]
}
