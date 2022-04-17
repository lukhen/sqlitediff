export interface TableSchemaDiff {
    intersection: string[];
    db1_db2: string[];
    db2_db1: string[];
}
