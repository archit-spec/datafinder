
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Database, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

const DataLoader = ({ db, onDataLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableName, setTableName] = useState('');
  const [progress, setProgress] = useState(0);

  const processFile = async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!tableName) {
        // Generate table name from file name
        setTableName(file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_"));
      }

      const conn = await db.connect();

      if (file.name.endsWith('.csv')) {
        // Process CSV file
        const text = await file.text();
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        if (!parsed.data || parsed.data.length === 0) {
          throw new Error('No data found in CSV');
        }

        // Create table schema
        const columns = Object.keys(parsed.data[0]);
        const columnTypes = columns.map(col => {
          const sampleValue = parsed.data[0][col];
          switch (typeof sampleValue) {
            case 'number':
              return Number.isInteger(sampleValue) ? 'INTEGER' : 'DOUBLE';
            case 'boolean':
              return 'BOOLEAN';
            default:
              return 'VARCHAR';
          }
        });

        // Create table
        const createTableSQL = `
          CREATE TABLE ${tableName} (
            ${columns.map((col, i) => `"${col}" ${columnTypes[i]}`).join(',\n')}
          )
        `;

        await conn.query(createTableSQL);

        // Insert data in batches
        const BATCH_SIZE = 1000;
        for (let i = 0; i < parsed.data.length; i += BATCH_SIZE) {
          setProgress(Math.round((i / parsed.data.length) * 100));
          
          const batch = parsed.data.slice(i, i + BATCH_SIZE);
          const values = batch.map(row => 
            `(${columns.map(col => {
              const val = row[col];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return val;
            }).join(',')})`
          ).join(',');

          const insertSQL = `
            INSERT INTO ${tableName} 
            (${columns.map(col => `"${col}"`).join(',')})
            VALUES ${values}
          `;

          await conn.query(insertSQL);
        }
      } else if (file.name.endsWith('.json')) {
        // Process JSON file
        const text = await file.text();
        const data = JSON.parse(text);
        const jsonArray = Array.isArray(data) ? data : [data];

        if (jsonArray.length === 0) {
          throw new Error('No data found in JSON');
        }

        // Create table schema
        const columns = Object.keys(jsonArray[0]);
        const columnTypes = columns.map(col => {
          const sampleValue = jsonArray[0][col];
          switch (typeof sampleValue) {
            case 'number':
              return Number.isInteger(sampleValue) ? 'INTEGER' : 'DOUBLE';
            case 'boolean':
              return 'BOOLEAN';
            case 'object':
              return sampleValue === null ? 'VARCHAR' : 'JSON';
            default:
              return 'VARCHAR';
          }
        });

        const createTableSQL = `
          CREATE TABLE ${tableName} (
            ${columns.map((col, i) => `"${col}" ${columnTypes[i]}`).join(',\n')}
          )
        `;

        await conn.query(createTableSQL);

        // Insert data in batches
        const BATCH_SIZE = 1000;
        for (let i = 0; i < jsonArray.length; i += BATCH_SIZE) {
          setProgress(Math.round((i / jsonArray.length) * 100));
          
          const batch = jsonArray.slice(i, i + BATCH_SIZE);
          const values = batch.map(row => 
            `(${columns.map(col => {
              const val = row[col];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return val;
            }).join(',')})`
          ).join(',');

          const insertSQL = `
            INSERT INTO ${tableName} 
            (${columns.map(col => `"${col}"`).join(',')})
            VALUES ${values}
          `;

          await conn.query(insertSQL);
        }
      } else {
        throw new Error('Unsupported file type. Please upload CSV or JSON files.');
      }

      await conn.close();
      setProgress(100);
      onDataLoaded(tableName);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database size={20} />
          Data Loader
          {error && <AlertCircle className="text-red-500" size={20} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Table name (optional)"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
              className="flex-1"
            />
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Loading data... {progress}%
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 items-center text-sm text-gray-500">
            <FileText size={16} />
            <span>Supported formats: CSV, JSON</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataLoader;