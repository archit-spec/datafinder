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
              <TableRow className="bg-gray-50">
                {data.length > 0 && Object.keys(data[0]).map((header) => (
                  <TableHead key={header} className="font-semibold">
                    <div className="flex items-center gap-2">
                      {header}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none">
                          {sortConfig.key === header ? (
                            sortConfig.direction === 'asc' ? (
                              <SortAsc className="h-4 w-4 text-gray-500" />
                            ) : (
                              <SortDesc className="h-4 w-4 text-gray-500" />
                            )
                          ) : (
                            <Filter className="h-4 w-4 text-gray-500" />
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
              {data
                .filter(item => 
                  filter === '' || 
                  Object.values(item).some(val => 
                    val.toString().toLowerCase().includes(filter.toLowerCase())
                  )
                )
                .map((row, index) => (
                  <TableRow 
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {Object.entries(row).map(([key, value], cellIndex) => (
                      <TableCell key={cellIndex}>
                        {key === 'status' ? (
                          <Badge className={`${statusColors[value as string]} font-medium`}>
                            {value}
                          </Badge>
                        ) : key === 'performance' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{value}%</span>
                          </div>
                        ) : (
                          typeof value === 'number' ? 
                            value.toLocaleString() : 
                            value
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveTable;