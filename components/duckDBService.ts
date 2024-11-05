// components/duckDBService.ts
import * as duckdb from '@duckdb/duckdb-wasm';
import { Groq } from "groq-sdk";

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
  },

  async getTableSchema() {
    try {
      const schemaQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'dataset_table'
        ORDER BY ordinal_position;
      `;
      
      const schema = await this.executeQuery(schemaQuery);
      return schema;
    } catch (error) {
      console.error('Failed to get table schema:', error);
      throw error;
    }
  },

  async getSampleData() {
    try {
      const sampleQuery = `
        SELECT *
        FROM dataset_table
        LIMIT 2;
      `;
      
      const sample = await this.executeQuery(sampleQuery);
      return sample;
    } catch (error) {
      console.error('Failed to get sample data:', error);
      throw error;
    }
  },

  async getNLtoSQL(naturalLanguageQuery: string) {
    try {
      // Get table information
      const schema = await this.getTableSchema();
      const sampleData = await this.getSampleData();

      const groq = new Groq({ 
        apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY ,
        dangerouslyAllowBrowser: true
      });

      const prompt = `
        genearte raw sql query with no markdown formatting like json
        and no extra text output should always only be sql query
        You are a SQL query generator for DuckDB. 
        
        Database Context:
        Table Name: dataset_table
        
        Schema:
        ${JSON.stringify(schema, null, 1)}
        
        Sample Data:
        ${JSON.stringify(sampleData, null, 1)}
        
        Convert this natural language query to SQL:
        "${naturalLanguageQuery}"
        
        Rules:
        1. Use only standard SQL syntax
        2. Query from the table named 'dataset_table'
        3. Return only the SQL query, no explanations
        4. Ensure the query is valid DuckDB syntax
        5. Use the actual column names from the schema
        6. Consider the data types when writing conditions
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-70b-versatile",
        "max_tokens": 8000,

      });

      const sqlQuery = completion.choices[0]?.message?.content;
      if (!sqlQuery) {
        throw new Error('Failed to generate SQL query');
      }

      console.log('Generated SQL:', sqlQuery);
      return sqlQuery;
    } catch (error) {
      console.error('Failed to convert natural language to SQL:', error);
      throw error;
    }
  }
};