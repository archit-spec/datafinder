// components/duckDBService.ts
import * as duckdb from '@duckdb/duckdb-wasm';
import { Groq } from "groq-sdk";

export const duckDBService = {
  db: null as duckdb.AsyncDuckDB | null,
  conn: null as any,
  defaultDatasetUrl: 'https://huggingface.co/datasets/archit11/distilabel-example/resolve/main/data/train-00000-of-00001.parquet?download=true',

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

  async createTableFromDataset(datasetUrl: string = this.defaultDatasetUrl) {
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
  serializeData(data: any) {
    return JSON.stringify(data, (_, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value
    );
  },

  async getNLtoSQL(naturalLanguageQuery: string) {
    try {
      // Get table information
      const schema = await this.getTableSchema();
      const sampleData = await this.getSampleData();

      const groq = new Groq({ 
        apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const prompt = `
        You are a SQL query generator for DuckDB. 
        
        Database Context:
        Table Name: dataset_table
        
        Schema:
        ${this.serializeData(schema)}
        
        Sample Data:
        ${this.serializeData(sampleData)}
        
        Natural Language Query:
        "${naturalLanguageQuery}"
        
        Rules:
        1. Use only standard SQL syntax compatible with DuckDB
        2. Query from the table named 'dataset_table'
        3. Return only the SQL query without any explanations
        4. Use the actual column names from the schema
        5. Consider the data types when writing conditions
        6. Handle numeric values appropriately
        7. If the query involves aggregations, use appropriate GROUP BY clauses
        8. For text searches, use LIKE or ILIKE for case-insensitive matches
        
        Example Queries:
        - "Show all columns where value > 100"
          SELECT * FROM dataset_table WHERE value > 100;
        
        - "Find average by category"
          SELECT category, AVG(value) FROM dataset_table GROUP BY category;
        
        - "Search for text containing 'example'"
          SELECT * FROM dataset_table WHERE column_name ILIKE '%example%';
        
        Generate SQL for the natural language query above:
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a SQL expert specializing in DuckDB queries. Generate only SQL queries without any explanations or additional text."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.3, // Lower temperature for more focused SQL generation
      });

      const sqlQuery = completion.choices[0]?.message?.content?.trim();
      if (!sqlQuery) {
        throw new Error('Failed to generate SQL query');
      }

      // Validate that the response is a SQL query
      if (!sqlQuery.toUpperCase().includes('SELECT')) {
        throw new Error('Invalid SQL query generated');
      }

      console.log('Generated SQL:', sqlQuery);
      return sqlQuery;
    } catch (error) {
      console.error('Failed to convert natural language to SQL:', error);
      throw error;
    }
  }
};

// import { usePathname } from "next/navigation"
// // Add isActive prop to items
// const pathname = usePathname()
// // Add isActive prop to items

// item = {
//   title: string,
//   href: string,
//   isActive: boolean
// }
// // make an item object
// const item: Item = {
//   title: string,
//   href: string,
//   isActive: boolean
// }
// const isActive = pathname === item.href

// import Link from "next/link"
// // Add href to items interface and wrap Cards in Link
// <Link href={item.href}>
//   <Card className={cn("hover:bg-accent transition-colors", 
//     isActive && "bg-accent")} />
// </Link>

// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible"import { Item } from '@radix-ui/react-dropdown-menu';

