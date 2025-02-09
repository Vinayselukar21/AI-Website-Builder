import StepList from "@/components/StepList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BACKEND_URL } from "@/config";
import { parseXml, Step, StepType } from "@/steps";
import Editor from "@monaco-editor/react";
import axios from "axios";
import {
  ChevronDown,
  ChevronRight,
  Code,
  Eye,
  FileCode,
  Folder,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
// import WebContainer from "@/components/WebContainer";
import { useWebContainer } from "@/hooks/useWebContainer";

interface FileStructure {
  name: string;
  type: "file" | "folder";
  children?: FileStructure[];
  content?: string;
  path?: string;
}

// const mockFiles: FileStructure[] = [
//   {
//     name: "src",
//     type: "folder",
//     children: [
//       {
//         name: "App.tsx",
//         type: "file",
//         content:
//           "function sumArray(numbers) {  let sum = 0;  for (let i = 0; i < numbers.length; i++) {    sum += numbers[i];  }  return sum;} const nums = [1, 2, 3, 4, 5]; console.log(sumArray(nums)); // Output: 15",
//       },
//       {
//         name: "index.tsx",
//         type: "file",
//         content:
//           'import React from "react";\nimport ReactDOM from "react-dom";',
//       },
//     ],
//   },
//   {
//     name: "package.json",
//     type: "file",
//     content: '{\n  "name": "project",\n  "version": "1.0.0"\n}',
//   },
// ];

export default function BuilderPage() {
  const location = useLocation();
  const webcontainer = useWebContainer();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("code");
  const [steps, setSteps] = useState<any[]>([]);
  const [files, setFiles] = useState<FileStructure[]>([]);
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    content: string | undefined;
  }>({
    path: "",
    content: "",
  });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const prompt = location.state?.prompt || "";

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === "pending")
      .map((step: any) => {
        updateHappened = true;
        if (step.type === StepType.CreateFile) {
          console.log("------------create------------");
          let parsedPath = step.path?.split("/");
          console.log(parsedPath, parsedPath.length, "parsedPath---cf");
          let currentFileStructure = [...originalFiles];
          let finalAnswerRef = currentFileStructure;
          console.log(currentFileStructure, "currentFileStructure----cf");
          let currentFolder = "";

          // Use a for loop instead of while to avoid infinite loop
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];

            console.log(currentFolderName, "currentFolderName----cf");
            parsedPath.shift();
            if (!parsedPath.length) {
              // final file
              console.log(currentFolder, "currentFolder----cf");
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                console.log(
                  "pushing files for folder",
                  currentFolder,
                  parsedPath.length,
                  "----cf"
                );
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "file",
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              /// in a folder
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // create the folder
                console.log(
                  "creating a folder",
                  currentFolder,
                  currentFolderName,
                  "----cf"
                );
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "folder",
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });
    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: "completed",
          };
        })
      );
    }
    // console.log(files, "files");
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: any[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: any, isRootFolder: boolean) => {
        if (file.type === "folder") {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(
                  file.children.map((child: any) => [
                    child.name,
                    processFile(child, false),
                  ])
                )
              : {},
          };
        } else if (file.type === "file") {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || "",
              },
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || "",
              },
            };
          }
        }

        return mountStructure[file.name];
      };

      // Process each top-level file/folder
      files.forEach((file) => processFile(file, true));

      return mountStructure;
    };

    const mountStructure = createMountStructure(files);

    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  console.log(files, "files");
  async function init() {
    const templateResponse = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt,
    });

    const { prompts, uiPrompts } = templateResponse.data;

    console.log([...prompts, prompt], "prompts");

    const parsedSteps = parseXml(uiPrompts[0]);

    console.log(parsedSteps, "parsedSteps");

    setSteps((steps) =>
      [...steps, ...parsedSteps]?.map((step) => ({
        ...step,
        status: "pending",
      }))
    );

    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      prompts: [...prompts, prompt].map((content) => ({
        role: "user",
        content: content,
      })),
    });

    const parsedStepsResponse = parseXml(
      stepsResponse?.data?.[0]?.message?.content
    );

    console.log(parsedStepsResponse, "parsedStepsResponse");

    setSteps((steps) =>
      [...steps, ...parsedStepsResponse].map((step) => ({
        ...step,
        status: "pending",
      }))
    );

    console.log(stepsResponse?.data?.[0]?.message?.content, "stepResponse");
  }
  console.log(steps, "steps");

  useEffect(() => {
    init();
  }, []);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (items: FileStructure[], path = "") => {
    return items.map((item) => {
      const currentPath = `${path}/${item.name}`;
      if (item.type === "folder") {
        const isExpanded = expandedFolders.has(currentPath);
        return (
          <div key={currentPath}>
            <button
              onClick={() => {
                toggleFolder(currentPath);
              }}
              className="flex items-center space-x-2 w-full hover:bg-accent hover:text-accent-foreground p-2 rounded-sm"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
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
          onClick={() =>
            setSelectedFile({ path: currentPath, content: item.content })
          }
          className={`flex items-center space-x-2 w-full p-2 rounded-sm ${
            selectedFile.path === currentPath
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
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
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </header>

        <div className="flex-1 flex gap-4 p-4">
          <div className="w-96 space-y-4">
            <StepList steps={steps} />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  // value={prompt}
                  // onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button className="w-full">Generate</Button>
              </CardContent>
            </Card>
          </div>

          <Card className="flex-1">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <div className="px-4 pt-2">
                <TabsList>
                  <TabsTrigger
                    value="code"
                    className="flex items-center space-x-2"
                  >
                    <Code className="w-4 h-4" />
                    <span>Code</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 flex mt-0 p-4">
                <Card className="w-64">
                  <ScrollArea className="h-[calc(100vh-13rem)]">
                    <div className="p-4">{renderFileTree(files)}</div>
                  </ScrollArea>
                </Card>
                <div className="flex-1 ml-4">
                  {selectedFile.path && selectedFile.content ? (
                    <Card className="h-full">
                      <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        theme={theme === "dark" ? "vs-dark" : "light"}
                        value={selectedFile.content}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: "on",
                          scrollBeyondLastLine: false,
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
                  {/* <Webcontainer webcontainer={webcontainer} /> */}
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
