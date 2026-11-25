import { getRuntimeBinding } from './runtime.js';

let mysqlPool;
let cachedD1;
let cachedD1Pool;

function bindValues(values = []) {
  return values.map((value) => {
    if (Array.isArray(value)) return value;
    if (value instanceof Date) return value.toISOString().replace('T', ' ').replace('Z', '');
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value ?? null;
  });
}

function expandArrayParameters(sql, values) {
  const params = [];
  let index = 0;
  const query = sql.replace(/\bIN\s*\(\s*\?\s*\)/gi, (match) => {
    const value = values[index];
    if (!Array.isArray(value)) {
      params.push(value);
      index += 1;
      return match;
    }
    index += 1;
    params.push(...value);
    return `IN (${value.map(() => '?').join(',')})`;
  });
  for (; index < values.length; index += 1) {
    params.push(values[index]);
  }
  return [query, bindValues(params)];
}

function normalizeSql(sql) {
  return sql
    .replace(/\s+FOR UPDATE\b/gi, '')
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bINSERT IGNORE INTO\b/gi, 'INSERT OR IGNORE INTO')
    .replace(/DATE_FORMAT\(\s*created_at\s*,\s*'%Y-%m'\s*\)/gi, "strftime('%Y-%m', created_at)")
    .replace(/ON DUPLICATE KEY UPDATE setting_value=VALUES\(setting_value\)/gi,
      'ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value');
}

function makeInsertId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function addExplicitInsertId(sql, params) {
  const match = sql.match(/^(\s*INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+[\w`"]+\s*\()([^)]+)(\)\s*VALUES\s*\()/i);
  if (!match || match[2].split(',').some((column) => column.trim().replace(/[`"]/g, '').toLowerCase() === 'id')) {
    return { sql, params, insertId: null };
  }
  const insertId = makeInsertId();
  return {
    sql: sql.replace(match[0], `${match[1]}id,${match[2]}${match[3]}?,`),
    params: [insertId, ...params],
    insertId
  };
}

function isReadQuery(sql) {
  return /^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql);
}

function createD1Client(database) {
  async function run(sql, values, method) {
    const normalized = normalizeSql(sql);
    const [query, params] = expandArrayParameters(normalized, values);
    const statement = database.prepare(query).bind(...params);
    if (method === 'read') {
      const { results = [] } = await statement.all();
      return [results, []];
    }
    const result = await statement.run();
    return [{
      insertId: result.meta?.last_row_id || 0,
      affectedRows: result.meta?.changes || 0,
      warningStatus: 0
    }, []];
  }

  return {
    query(sql, values = []) {
      return run(sql, values, isReadQuery(sql) ? 'read' : 'write');
    },
    execute(sql, values = []) {
      return run(sql, values, 'write');
    },
    async getConnection() {
      let statements = [];
      let inTransaction = false;

      const execute = async (sql, values = []) => {
        const normalized = normalizeSql(sql);
        const [query, params] = expandArrayParameters(normalized, values);
        if (!inTransaction) {
          const result = await database.prepare(query).bind(...params).run();
          return [{
            insertId: result.meta?.last_row_id || 0,
            affectedRows: result.meta?.changes || 0,
            warningStatus: 0
          }, []];
        }
        const inserted = addExplicitInsertId(query, params);
        statements.push(database.prepare(inserted.sql).bind(...inserted.params));
        return [{ insertId: inserted.insertId || 0, affectedRows: 1, warningStatus: 0 }, []];
      };

      return {
        async beginTransaction() {
          inTransaction = true;
          statements = [];
        },
        async query(sql, values = []) {
          if (!isReadQuery(sql)) return execute(sql, values);
          const normalized = normalizeSql(sql);
          const [query, params] = expandArrayParameters(normalized, values);
          const { results = [] } = await database.prepare(query).bind(...params).all();
          return [results, []];
        },
        execute,
        async commit() {
          if (statements.length) await database.batch(statements);
          statements = [];
          inTransaction = false;
        },
        async rollback() {
          statements = [];
          inTransaction = false;
        },
        release() {}
      };
    }
  };
}

async function getClient() {
  const database = getRuntimeBinding('DB');
  if (database) {
    if (cachedD1 !== database) {
      cachedD1 = database;
      cachedD1Pool = createD1Client(database);
    }
    return cachedD1Pool;
  }
  if (!mysqlPool) {
    const mysql = await import('mysql2/promise');
    mysqlPool = mysql.default.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ao_xinh',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return mysqlPool;
}

export const pool = {
  isD1() {
    return Boolean(getRuntimeBinding('DB'));
  },
  async query(...args) {
    return (await getClient()).query(...args);
  },
  async execute(...args) {
    return (await getClient()).execute(...args);
  },
  async getConnection() {
    return (await getClient()).getConnection();
  }
};
