'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Search, Database, Settings, Loader2, Upload, Table as TableIcon, FileJson } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { duckDBService } from './duckDBService';
const PastelTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [query, setQuery] = useState('');
  const [schema, setSchema] = useState([]);
  const [datasetUrl, setDatasetUrl] = useState(duckDBService.defaultDatasetUrl);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [activeTab, setActiveTab] = useState('query');
  const { toast } = useToast();

  useEffect(() => {
    initializeDuckDB();
  }, []);

  const initializeDuckDB = async () => {
    try {
      const success = await duckDBService.initialize();
      if (success) {
        setInitialized(true);
        await handleLoadDataset();
        await fetchSchema();
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

  const fetchSchema = async () => {
    try {
      const schemaData = await duckDBService.getTableSchema();
      setSchema(schemaData);
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
  };

  const handleLoadDataset = async () => {
    if (!datasetUrl.trim()) return;
    setLoading(true);
    try {
      const result = await duckDBService.createTableFromDataset(datasetUrl);
      setData(result);
      await fetchSchema();
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

  const handleQueryExecution = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await duckDBService.executeQuery(query);
      setData(result);
      toast({
        title: "Success",
        description: "Query executed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
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
    <div className="flex gap-6">
      <Card className="w-64 h-fit bg-rose-50/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-rose-700">Schema Info</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="schema">
              <AccordionTrigger className="text-rose-600">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  Table Schema
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[300px]">
                  {schema.map((col, idx) => (
                    <div key={idx} className="py-2">
                      <p className="font-mono text-sm text-rose-900">{col.column_name}</p>
                      <Badge variant="outline" className="mt-1 bg-rose-100 text-rose-700">
                        {col.data_type}
                      </Badge>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="flex-1 bg-white">
        <CardHeader className="bg-blue-50/50 rounded-t-lg border-b border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-700">DuckDB Explorer</CardTitle>
              <CardDescription className="text-blue-600">Query and analyze your data</CardDescription>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="bg-blue-100 hover:bg-blue-200">
                  <Settings className="h-4 w-4 text-blue-700" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-blue-50">
                <SheetHeader>
                  <SheetTitle className="text-blue-700">Dataset Configuration</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-700">Dataset URL</h4>
                    <Input
                      value={datasetUrl}
                      onChange={(e) => setDatasetUrl(e.target.value)}
                      placeholder="Enter dataset URL..."
                      className="bg-white"
                    />
                    <Button 
                      onClick={handleLoadDataset}
                      className="w-full bg-blue-200 hover:bg-blue-300 text-blue-700"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Load Dataset
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-violet-50">
              <TabsTrigger 
                value="query" 
                className="data-[state=active]:bg-violet-200 data-[state=active]:text-violet-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Natural Language
              </TabsTrigger>
              <TabsTrigger 
                value="sql"
                className="data-[state=active]:bg-violet-200 data-[state=active]:text-violet-700"
              >
                <Database className="h-4 w-4 mr-2" />
                SQL Query
              </TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="space-y-4">
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
                  className="bg-violet-100 hover:bg-violet-200 text-violet-700"
                  disabled={loading || !initialized}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Ask
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sql" className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter SQL query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                  disabled={loading || !initialized}
                />
                <Button 
                  onClick={handleQueryExecution}
                  className="bg-violet-100 hover:bg-violet-200 text-violet-700"
                  disabled={loading || !initialized}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Execute
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {generatedSQL && (
            <Alert className="my-4 bg-green-50 border-green-100">
              <AlertDescription>
                <p className="font-medium text-green-700 mb-2">Generated SQL:</p>
                <pre className="bg-green-100 p-3 rounded-md text-sm overflow-x-auto text-green-800">
                  {generatedSQL}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[500px] mt-4 rounded-md border border-gray-200">
            <Table>
              <TableHeader>
                {data[0] && (
                  <TableRow className="bg-yellow-50">
                    {Object.keys(data[0]).map((header, idx) => (
                      <TableHead key={idx} className="font-semibold text-yellow-800">
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
                    className="hover:bg-yellow-50/50 transition-colors"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PastelTable;