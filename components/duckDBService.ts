// components/duckDBService.ts
import * as duckdb from '@duckdb/duckdb-wasm';

export const duckDBService = {
  db: null as duckdb.AsyncDuckDB | null,
  conn: null as any,

  async initialize() {
    try {
      console.log('Starting DuckDB initialization...');
      
      // Define bundles using local paths
      const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
        mvp: {
          mainModule: '/duckdb/duckdb-mvp.wasm',
          mainWorker: '/duckdb/duckdb-browser-mvp.worker.js',
        },
        eh: {
          mainModule: '/duckdb/duckdb-eh.wasm',
          mainWorker: '/duckdb/duckdb-browser-eh.worker.js',
        },
      };

      console.log('Bundle configuration:', MANUAL_BUNDLES);

      // Select bundle
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      console.log('Selected bundle:', bundle);

      // Initialize worker and logger
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      console.log('Worker and logger initialized');

      // Create and instantiate database
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule);
      console.log('Database instantiated');

      // Create connection
      const conn = await db.connect();
      console.log('Connection established');

      this.db = db;
      this.conn = conn;

      return true;
    } catch (error) {
      console.error('DuckDB initialization failed:', {
        error,
        message: error?.message,
        stack: error?.stack
      });
      return false;
    }
  },

  async executeQuery(query: string) {
    if (!this.conn) {
      throw new Error('Database connection not initialized');
    }

    try {
      console.log('Executing query:', query);
      const result = await this.conn.query(query);
      return result.toArray();
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  },

  async createTableFromDataset(datasetUrl: string) {
    try {
      // Create table from dataset using hf:// path
      const createTableQuery = `
        CREATE OR REPLACE TABLE dataset_table AS
        SELECT *
        FROM '${datasetUrl}';
      `;
      
      await this.executeQuery(createTableQuery);
      console.log('Table created successfully');
      
      // Get initial data
      const result = await this.executeQuery(`
        SELECT *
        FROM dataset_table
        LIMIT 10;
      `);
      
      return result;
    } catch (error) {
      console.error('Failed to create table:', error);
      throw error;
    }
  }
};