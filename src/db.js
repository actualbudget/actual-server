import Database from 'better-sqlite3';

class WrappedDatabase {
  constructor(db) {
    this.db = db;
  }

  /**
   * @param {string} sql
   * @param {string[]} params
   */
  all(sql, params = []) {
    let stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * @param {string} sql
   * @param {string[]} params
   */
  first(sql, params = []) {
    let rows = this.all(sql, params);
    return rows.length === 0 ? null : rows[0];
  }

  /**
   * @param {string} sql
   */
  exec(sql) {
    return this.db.exec(sql);
  }

  /**
   * @param {string} sql
   * @param {string[]} params
   */
  mutate(sql, params = []) {
    let stmt = this.db.prepare(sql);
    let info = stmt.run(...params);
    return { changes: info.changes, insertId: info.lastInsertRowid };
  }

  /**
   * @param {() => void} fn
   */
  transaction(fn) {
    return this.db.transaction(fn)();
  }

  close() {
    this.db.close();
  }

  /**
   * Delete items by a list of IDs
   * @param {string} tableName
   * @param {number[]} ids
   * @returns {number} Total number of rows deleted
   */
  deleteByIds(tableName, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('The provided ids must be a non-empty array.');
    }

    const CHUNK_SIZE = 999;
    let totalChanges = 0;

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE).map(String); // Convert numbers to strings
      const placeholders = chunk.map(() => '?').join(',');
      const sql = `DELETE FROM ${tableName} WHERE id IN (${placeholders})`;
      const result = this.mutate(sql, chunk);
      totalChanges += result.changes;
    }

    return totalChanges;
  }
}

/** @param {string} filename */
export default function openDatabase(filename) {
  return new WrappedDatabase(new Database(filename));
}
