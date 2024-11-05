import React, { useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import InteractiveDuckDBTable from './InteractiveDuckDBTable';
import DataLoader from './DataLoader';

const DUCKDB_BUNDLES = {
  mvp: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js',
  },
};

const DuckDBInterface = () => {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const initDB = async () => {
      try {
        const worker = new Worker(DUCKDB_BUNDLES.mvp.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(DUCKDB_BUNDLES.mvp.mainModule);
        
        setDb(db);
        setLoading(false);
        
        // Get initial tables
        await refreshTables(db);
      } catch (err) {
        setError(`Failed to initialize DuckDB: ${err.message}`);
        setLoading(false);
      }
    };

    initDB();

    return () => {
      if (db) db.terminate();
    };
  }, []);

  const refreshTables = async (database) => {
    try {
      const conn = await database.connect();
      const result = await conn.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'main'
      `);
      await conn.close();
      
      setTables(result.toArray().map(row => row[0]));
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const handleDataLoaded = async (tableName) => {
    await refreshTables(db);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p>Initializing DuckDB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded flex items-center gap-2">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Tabs defaultValue="query" className="w-full">
        <TabsList>
          <TabsTrigger value="query">Query Data</TabsTrigger>
          <TabsTrigger value="load">Load Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="query" className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Available Tables:</h3>
            <div className="flex flex-wrap gap-2">
              {tables.map(table => (
                <span key={table} className="px-2 py-1 bg-white border rounded text-sm">
                  {table}
                </span>
              ))}
            </div>
          </div>
          
          <InteractiveDuckDBTable db={db} />
        </TabsContent>
        
        <TabsContent value="load">
          <DataLoader db={db} onDataLoaded={handleDataLoaded} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DuckDBInterface;