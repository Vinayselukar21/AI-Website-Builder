import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import Editor from '@monaco-editor/react';
import { ChevronDown, ChevronRight, Code, Eye, FileCode, Folder, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface FileStructure {
  name: string;
  type: 'file' | 'folder';
  children?: FileStructure[];
  content?: string;
}

const mockFiles: FileStructure[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'App.tsx',
        type: 'file',
        content: 'function App() { return <div>Hello World</div> }'
      },
      {
        name: 'index.tsx',
        type: 'file',
        content: 'import React from "react";\nimport ReactDOM from "react-dom";'
      }
    ]
  },
  {
    name: 'package.json',
    type: 'file',
    content: '{\n  "name": "project",\n  "version": "1.0.0"\n}'
  }
];

export default function BuilderPage() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('code');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState(location.state?.prompt || '');

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (items: FileStructure[], path = '') => {
    return items.map((item) => {
      const currentPath = `${path}/${item.name}`;
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.has(currentPath);
        return (
          <div key={currentPath}>
            <button
              onClick={() => toggleFolder(currentPath)}
              className="flex items-center space-x-2 w-full hover:bg-accent hover:text-accent-foreground p-2 rounded-sm"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-blue-500" />
              <span>{item.name}</span>
            </button>
            {isExpanded && item.children && (
              <div className="ml-4">
                {renderFileTree(item.children, currentPath)}
              </div>
            )}
          </div>
        );
      }
      return (
        <button
          key={currentPath}
          onClick={() => setSelectedFile(currentPath)}
          className={`flex items-center space-x-2 w-full p-2 rounded-sm ${
            selectedFile === currentPath
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <FileCode className="w-4 h-4 text-muted-foreground" />
          <span>{item.name}</span>
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-screen flex flex-col">
        <header className="p-4 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-xl font-bold">AI Website Builder</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </header>

        <div className="flex-1 flex gap-4 p-4">
          <div className="w-96 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-2 bg-primary/10 text-primary rounded-md">1. Initial Setup</div>
                <div className="p-2 bg-muted text-muted-foreground rounded-md">2. Generating Files</div>
                <div className="p-2 bg-muted text-muted-foreground rounded-md">3. Styling</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button className="w-full">
                  Generate
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4 pt-2">
                <TabsList>
                  <TabsTrigger value="code" className="flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <span>Code</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 flex mt-0 p-4">
                <Card className="w-64">
                  <ScrollArea className="h-[calc(100vh-13rem)]">
                    <div className="p-4">
                      {renderFileTree(mockFiles)}
                    </div>
                  </ScrollArea>
                </Card>
                <div className="flex-1 ml-4">
                  {selectedFile ? (
                    <Card className="h-full">
                      <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        value={mockFiles[0].children?.[0].content}
                        options={{
                          minimap: { enabled: false },
                          readOnly: true
                        }}
                      />
                    </Card>
                  ) : (
                    <Card className="h-full flex items-center justify-center text-muted-foreground">
                      Select a file to view its contents
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 mt-0 p-4">
                <Card className="h-full">
                  <iframe
                    title="Preview"
                    className="w-full h-full rounded-lg"
                    src="about:blank"
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}