export enum StepType {
  CreateFile,
  CreateFolder,
  EditFile,
  DeleteFile,
  RunScript,
}

export interface Step {
  id: number;
  title: string;
  description: string;
  type: StepType;
  status: "pending" | "in-progress" | "completed";
  code?: string;
  path?: string;
}
export function parseXml(response: string): Step[] {
  // Extract the XML content between <boltArtifact> tags
  // console.log(response, "response in xml function");
  // const noXmlMatch = !response.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
  // console.log(noXmlMatch, "noXmlMatch");
  const xmlMatch = response.match(
    /<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/
  );

  if (!xmlMatch) {
    return [];
  }

  const xmlContent = xmlMatch[1];
  const steps: Step[] = [];
  let stepId = 1;

  // Extract artifact title
  const titleMatch = response.match(/title="([^"]*)"/);
  const artifactTitle = titleMatch ? titleMatch[1] : "Project Files";
  // console.log(artifactTitle, "artifactTitle");
  // Add initial artifact step
  steps.push({
    id: stepId++,
    title: artifactTitle,
    description: "",
    type: StepType.CreateFolder,
    status: "pending",
  });

  // Regular expression to find boltAction elements
  const actionRegex =
    /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;

  let match;
  while ((match = actionRegex.exec(xmlContent)) !== null) {
    // console.log(match, "match");
    const [, type, filePath, content] = match;
    // console.log(type, filePath , content, "type");
    if (type === "file") {
      // File creation step
      steps.push({
        // file,
        id: stepId++,
        title: `Create ${filePath || "file"}`,
        description: "",
        type: StepType.CreateFile,
        status: "pending",
        code: content.trim(),
        path: filePath,
      });
    } else if (type === "shell") {
      // Shell command step
      steps.push({
        id: stepId++,
        title: "Run command",
        description: "",
        type: StepType.RunScript,
        status: "pending",
        code: content.trim(),
      });
    }
  }

  console.log(steps, "steps in xml function");

  return steps;
}
