/** @noSelfInFile */

/** @tupleReturn */
declare function strsplit(separator: string, source: string, limit?: number): string[];

interface String {
  format(...parts: string[]): string;
}
