'use client';
// Change this line:
// And add the Toaster component import if you're using it
import { Toaster } from "@/components/ui/toaster"
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Search, SortAsc, SortDesc, Filter, Database, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { duckDBService } from './duckDBService';
import { cn } from "@/lib/utils";

interface DataRow {
  id: number;
  name: string;
  status: string;
  users: number;
  performance: number;
}

interface SortConfig {
  key: keyof DataRow | null;
  direction: 'asc' | 'desc';
}

const InteractiveTable = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [filter, setFilter] = useState('');
  const [datasetUrl, setDatasetUrl] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    initializeDuckDB();
  }, []);

  const initializeDuckDB = async () => {
    try {
      const success = await duckDBService.initialize();
      if (success) {
        setInitialized(true);
        toast({
          title: "Connected",
          description: "DuckDB initialized successfully",
        });
      }
    } catch (error) {
      console.error('Failed to initialize DuckDB:', error);
      toast({
        title: "Error",
        description: "Failed to initialize DuckDB",
        variant: "destructive",
      });
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Convert natural language to SQL
      const sqlQuery = await duckDBService.getNLtoSQL(query);
      
      // Execute the query
      const result = await duckDBService.executeQuery(sqlQuery);
      
      setData(result as DataRow[]);
      toast({
        title: "Query Executed",
        description: "Data has been updated successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Query execution failed:', error);
      toast({
        title: "Query Error",
        description: "Failed to execute query. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof DataRow) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    
    const sortedData = [...data].sort((a, b) => {
      if (direction === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      }
      return a[key] < b[key] ? 1 : -1;
    });
    
    setData(sortedData);
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-red-100 text-red-800',
  };

  const handleLoadDataset = async () => {
    if (!datasetUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a dataset URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Loading dataset:', datasetUrl);
      
      const result = await duckDBService.createTableFromDataset(datasetUrl);
      setData(result);
      
      toast({
        title: "Success",
        description: "Dataset loaded successfully",
      });
    } catch (error) {
      console.error('Failed to load dataset:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load dataset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNaturalLanguageQuery = async () => {
    if (!naturalLanguageQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Convert natural language to SQL
      const sqlQuery = await duckDBService.getNLtoSQL(naturalLanguageQuery);
      setGeneratedSQL(sqlQuery);
      
      // Execute the generated SQL
      const result = await duckDBService.executeQuery(sqlQuery);
      setData(result);
      
      toast({
        title: "Success",
        description: "Query executed successfully",
      });
    } catch (error) {
      console.error('Query failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute query",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Database Explorer</CardTitle>
        <CardDescription>Query and analyze your data using natural language</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Query Input Section */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Try: 'show all active services' or 'show services with high performance'"
              className="pl-8 bg-white"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button 
            onClick={handleQuery}
            className="bg-black text-white hover:bg-gray-800"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Query
          </Button>
        </div>

        {/* Filter Input */}
        <div className="mb-4">
          <Input
            placeholder="Filter table..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
            disabled={loading}
          />
        </div>

        {/* Add Dataset Input Section */}
        <div className="flex gap-4 mb-6">
          <div className="space-y-2">
            <Input
              placeholder="Enter dataset URL (e.g., hf://datasets/username/dataset/file.csv)"
              value={datasetUrl}
              onChange={(e) => setDatasetUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              Format: hf://datasets/username/dataset/path_to_file
              (supports .csv, .parquet, .jsonl)
            </p>
            <Button 
              onClick={handleLoadDataset}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load Dataset'}
            </Button>
          </div>
        </div>

        {/* Interactive Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b">
                {data.length > 0 && Object.keys(data[0]).map((header) => (
                  <TableHead 
                    key={header} 
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      {header}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none">
                          {sortConfig.key === header ? (
                            sortConfig.direction === 'asc' ? (
                              <SortAsc className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                            ) : (
                              <SortDesc className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                            )
                          ) : (
                            <Filter className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleSort(header as keyof DataRow)}>
                            Sort Ascending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort(header as keyof DataRow)}>
                            Sort Descending
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={index}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  {Object.entries(row).map(([key, value], cellIndex) => (
                    <TableCell 
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-gray-900 border-b"
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* AI Query Input Section */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <Input
              placeholder="Ask a question about your data..."
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleNaturalLanguageQuery}
              disabled={loading || !naturalLanguageQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Ask AI
            </Button>
          </div>
          
          {generatedSQL && (
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Generated SQL:</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {generatedSQL}
              </pre>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            Example: "Show me the top 5 rows sorted by the first column"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveTable;