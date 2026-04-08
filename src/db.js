const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { Pool } = require('pg');

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : String(value);
}

function mapSubscriberRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    firstName: row.first_name ?? row.firstName ?? null,
    email: row.email,
    source: row.source,
    status: row.status,
    createdAt: normalizeTimestamp(row.created_at ?? row.createdAt),
    updatedAt: normalizeTimestamp(row.updated_at ?? row.updatedAt)
  };
}

function mapInquiryRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    company: row.company ?? null,
    message: row.message,
    source: row.source,
    status: row.status,
    createdAt: normalizeTimestamp(row.created_at ?? row.createdAt)
  };
}

function createSqliteDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const database = new DatabaseSync(dbPath);

  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS subscribers_touch_updated_at
    AFTER UPDATE ON subscribers
    FOR EACH ROW
    BEGIN
      UPDATE subscribers SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);

  const findSubscriber = database.prepare(`
    SELECT id, first_name AS firstName, email, source, status, created_at AS createdAt, updated_at AS updatedAt
    FROM subscribers
    WHERE email = ?
  `);

  const insertSubscriber = database.prepare(`
    INSERT INTO subscribers (first_name, email, source)
    VALUES (?, ?, ?)
  `);

  const updateSubscriber = database.prepare(`
    UPDATE subscribers
    SET first_name = ?, source = ?, status = 'active'
    WHERE email = ?
  `);

  const insertInquiry = database.prepare(`
    INSERT INTO inquiries (name, email, company, message, source)
    VALUES (?, ?, ?, ?, ?)
  `);
  const listSubscribersQuery = database.prepare(`
    SELECT id, first_name AS firstName, email, source, status, created_at AS createdAt, updated_at AS updatedAt
    FROM subscribers
    ORDER BY id DESC
    LIMIT ?
  `);
  const listInquiriesQuery = database.prepare(`
    SELECT
      id,
      name,
      email,
      company,
      message,
      source,
      status,
      created_at AS createdAt
    FROM inquiries
    ORDER BY id DESC
    LIMIT ?
  `);
  const allSubscribersQuery = database.prepare(`
    SELECT id, first_name AS firstName, email, source, status, created_at AS createdAt, updated_at AS updatedAt
    FROM subscribers
    ORDER BY id DESC
  `);
  const allInquiriesQuery = database.prepare(`
    SELECT
      id,
      name,
      email,
      company,
      message,
      source,
      status,
      created_at AS createdAt
    FROM inquiries
    ORDER BY id DESC
  `);

  function upsertSubscriber({ firstName, email, source }) {
    const existing = findSubscriber.get(email);

    if (existing) {
      updateSubscriber.run(firstName || existing.firstName || null, source, email);
      return {
        subscriber: findSubscriber.get(email),
        isNew: false
      };
    }

    insertSubscriber.run(firstName || null, email, source);

    return {
      subscriber: findSubscriber.get(email),
      isNew: true
    };
  }

  function countSubscribers() {
    const row = database.prepare('SELECT COUNT(*) AS total FROM subscribers').get();
    return row.total;
  }

  function listSubscribers(limit = 25) {
    return listSubscribersQuery.all(limit);
  }

  function createInquiry({ name, email, company, message, source }) {
    const result = insertInquiry.run(
      name,
      email,
      company || null,
      message,
      source
    );

    return database
      .prepare(`
        SELECT
          id,
          name,
          email,
          company,
          message,
          source,
          status,
          created_at AS createdAt
        FROM inquiries
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);
  }

  function countInquiries() {
    const row = database.prepare('SELECT COUNT(*) AS total FROM inquiries').get();
    return row.total;
  }

  function listInquiries(limit = 25) {
    return listInquiriesQuery.all(limit);
  }

  function exportSubscribers() {
    return allSubscribersQuery.all();
  }

  function exportInquiries() {
    return allInquiriesQuery.all();
  }

  function ping() {
    database.prepare('SELECT 1').get();
  }

  function close() {
    database.close();
  }

  return {
    driver: 'sqlite',
    ping,
    upsertSubscriber,
    countSubscribers,
    listSubscribers,
    createInquiry,
    countInquiries,
    listInquiries,
    exportSubscribers,
    exportInquiries,
    close
  };
}

function createPostgresDatabase(connectionString) {
  const ssl = /sslmode=require/i.test(connectionString)
    ? { rejectUnauthorized: false }
    : undefined;
  const pool = new Pool({
    connectionString,
    ssl
  });

  const initPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT,
      email TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_unique_idx
      ON subscribers ((lower(email)));

    CREATE OR REPLACE FUNCTION set_subscribers_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS subscribers_touch_updated_at ON subscribers;
    CREATE TRIGGER subscribers_touch_updated_at
    BEFORE UPDATE ON subscribers
    FOR EACH ROW
    EXECUTE FUNCTION set_subscribers_updated_at();

    CREATE TABLE IF NOT EXISTS inquiries (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS inquiries_created_at_idx
      ON inquiries (created_at DESC);
  `);

  async function ensureReady() {
    await initPromise;
  }

  async function upsertSubscriber({ firstName, email, source }) {
    await ensureReady();

    const { rows } = await pool.query(
      `
        INSERT INTO subscribers (first_name, email, source, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT ((lower(email)))
        DO UPDATE
        SET
          first_name = COALESCE(EXCLUDED.first_name, subscribers.first_name),
          source = EXCLUDED.source,
          status = 'active'
        RETURNING
          id,
          first_name,
          email,
          source,
          status,
          created_at,
          updated_at,
          (xmax = 0) AS is_new
      `,
      [firstName || null, email, source]
    );

    return {
      subscriber: mapSubscriberRow(rows[0]),
      isNew: rows[0]?.is_new === true
    };
  }

  async function countSubscribers() {
    await ensureReady();
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM subscribers');
    return rows[0].total;
  }

  async function listSubscribers(limit = 25) {
    await ensureReady();
    const { rows } = await pool.query(
      `
        SELECT id, first_name, email, source, status, created_at, updated_at
        FROM subscribers
        ORDER BY id DESC
        LIMIT $1
      `,
      [limit]
    );

    return rows.map(mapSubscriberRow);
  }

  async function createInquiry({ name, email, company, message, source }) {
    await ensureReady();
    const { rows } = await pool.query(
      `
        INSERT INTO inquiries (name, email, company, message, source)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, company, message, source, status, created_at
      `,
      [name, email, company || null, message, source]
    );

    return mapInquiryRow(rows[0]);
  }

  async function countInquiries() {
    await ensureReady();
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM inquiries');
    return rows[0].total;
  }

  async function listInquiries(limit = 25) {
    await ensureReady();
    const { rows } = await pool.query(
      `
        SELECT id, name, email, company, message, source, status, created_at
        FROM inquiries
        ORDER BY id DESC
        LIMIT $1
      `,
      [limit]
    );

    return rows.map(mapInquiryRow);
  }

  async function exportSubscribers() {
    await ensureReady();
    const { rows } = await pool.query(
      `
        SELECT id, first_name, email, source, status, created_at, updated_at
        FROM subscribers
        ORDER BY id DESC
      `
    );

    return rows.map(mapSubscriberRow);
  }

  async function exportInquiries() {
    await ensureReady();
    const { rows } = await pool.query(
      `
        SELECT id, name, email, company, message, source, status, created_at
        FROM inquiries
        ORDER BY id DESC
      `
    );

    return rows.map(mapInquiryRow);
  }

  async function ping() {
    await ensureReady();
    await pool.query('SELECT 1');
  }

  async function close() {
    await pool.end();
  }

  return {
    driver: 'postgres',
    ping,
    upsertSubscriber,
    countSubscribers,
    listSubscribers,
    createInquiry,
    countInquiries,
    listInquiries,
    exportSubscribers,
    exportInquiries,
    close
  };
}

function createDatabase(options = {}) {
  if (typeof options === 'string') {
    return createSqliteDatabase(options);
  }

  if (options.connectionString) {
    return createPostgresDatabase(options.connectionString);
  }

  return createSqliteDatabase(options.sqlitePath || path.join(process.cwd(), 'data', 'boring-money.db'));
}

module.exports = { createDatabase };
