import { Row } from "./Data";

export interface DataDiff {
    db1_db2: Row[];
    db2_db1: Row[];
    intersection: Row[];
}
