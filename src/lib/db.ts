import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

// 프로젝트 루트에 data 디렉토리 경로 설정
const dataDir = path.join(process.cwd(), 'data');

// data 디렉토리가 없으면 생성
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'dev.db');
const schemaPath = path.join(process.cwd(), 'schema.sql');

export function initializeDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }
  console.log('Initializing database connection and schema...');
  dbInstance = new Database(dbPath, { verbose: console.log });
  try {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    dbInstance.exec(schema);
    console.log('Database schema executed.');
  } catch (error) {
    console.error('Failed to read or execute schema:', error);
    // Optionally, close the db and rethrow or handle as appropriate
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    throw error; // Rethrow to indicate initialization failure
  }
  return dbInstance;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    // Automatically initialize if not already done.
    // This makes usage simpler in other modules.
    return initializeDb();
  }
  return dbInstance;
}

// 데이터베이스 연결을 닫는 함수 (애플리케이션 종료 시 호출)
export function closeDb() {
  if (dbInstance) {
    console.log('Closing database connection...');
    dbInstance.close();
    dbInstance = null; // Allow re-initialization if needed
    console.log('Database connection closed.');
  }
}

// Remove the default export
// export default db;
