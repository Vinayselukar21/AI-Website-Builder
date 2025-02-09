import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
const StepList = ({ steps }: { steps: any }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 bg-primary/5 text-primary rounded-md">
        {steps.map((step: any) => (
          <div key={step.id} className="flex gap-2 items-center">
            <CheckCircle size={17} className="text-green-600" /> {step.title}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
export default StepList;
