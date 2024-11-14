'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Database, Settings, Loader2, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { duckDBService } from './duckDBService';

const EnhancedTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [datasetUrl, setDatasetUrl] = useState(duckDBService.defaultDatasetUrl);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
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
        await handleLoadDataset();
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
      const result = await duckDBService.createTableFromDataset(datasetUrl);
      setData(result);
      toast({
        title: "Success",
        description: "Dataset loaded successfully",
      });
    } catch (error) {
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
    if (!naturalLanguageQuery.trim()) return;
    
    setLoading(true);
    try {
      const sqlQuery = await duckDBService.getNLtoSQL(naturalLanguageQuery);
      setGeneratedSQL(sqlQuery);
      const result = await duckDBService.executeQuery(sqlQuery);
      setData(result);
      toast({
        title: "Success",
        description: "Query executed successfully",
      });
    } catch (error) {
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
    <Card className="w-full bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">DuckDB Explorer</CardTitle>
            <CardDescription className="text-gray-100">Query and analyze your data</CardDescription>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-white/10 hover:bg-white/20">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Dataset Configuration</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Dataset URL</h4>
                  <Input
                    value={datasetUrl}
                    onChange={(e) => setDatasetUrl(e.target.value)}
                    placeholder="Enter dataset URL..."
                    className="mb-2"
                  />
                  <Button 
                    onClick={handleLoadDataset}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Load Dataset
                  </Button>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Connection Status</h4>
                  <Badge variant="outline" className={initialized ? "bg-green-50" : "bg-red-50"}>
                    {initialized ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Ask a question about your data..."
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                className="flex-1"
                disabled={loading || !initialized}
              />
              <Button 
                onClick={handleNaturalLanguageQuery}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || !initialized}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Query
              </Button>
            </div>

            {generatedSQL && (
              <Alert className="bg-gray-50 border border-gray-200">
                <AlertDescription>
                  <p className="font-medium mb-2">Generated SQL:</p>
                  <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                    {generatedSQL}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <ScrollArea className="h-[500px] rounded-md border border-gray-200">
            <Table>
              <TableHeader>
                {data[0] && (
                  <TableRow className="bg-gray-100">
                    {Object.keys(data[0]).map((header, idx) => (
                      <TableHead key={idx} className="font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {data.map((row, rowIdx) => (
                  <TableRow 
                    key={rowIdx}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    {Object.values(row).map((cell, cellIdx) => (
                      <TableCell key={cellIdx}>
                        {String(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTable;