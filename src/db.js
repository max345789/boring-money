const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function createDatabase(dbPath) {
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

  function close() {
    database.close();
  }

  return {
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

module.exports = { createDatabase };
