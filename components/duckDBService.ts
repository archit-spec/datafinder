// components/duckDBService.ts
import * as duckdb from '@duckdb/duckdb-wasm';
import { AsyncDuckDB } from '@duckdb/duckdb-wasm';

export const duckDBService = {
  db: null as AsyncDuckDB | null,
  conn: null,

  async initialize() {
    try {
      console.log('Starting DuckDB initialization...');
      
      // Define bundle location with absolute URLs
      const DUCKDB_CONFIG = {
        mainWorker: new URL('/duckdb-browser-mvp.worker.js', window.location.origin).href,
        mainModule: new URL('/duckdb-mvp.wasm', window.location.origin).href,
      };

      console.log('Using config:', DUCKDB_CONFIG);

      // Initialize the worker with explicit type
      const worker = new Worker(DUCKDB_CONFIG.mainWorker, {
        type: 'module'
      });
      console.log('Worker initialized');

      // Create and instantiate the database
      const db = new AsyncDuckDB(worker);
      console.log('DB instance created');
      
      await db.instantiate(DUCKDB_CONFIG.mainModule);
      console.log('DB instantiated');

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

  async queryDataset(datasetUrl: string) {
    if (!this.conn) {
      throw new Error('Database not initialized');
    }

    try {
      console.log('Querying dataset:', datasetUrl);
      
      // Create table from dataset
      const createTableQuery = `
        CREATE OR REPLACE TABLE dataset_table AS 
        SELECT * 
        FROM '${datasetUrl}'
      `;
      
      await this.conn.query(createTableQuery);
      console.log('Table created successfully');
      
      // Get sample data
      const result = await this.conn.query(`
        SELECT * 
        FROM dataset_table 
        LIMIT 10
      `);
      
      return result.toArray();
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  }
};