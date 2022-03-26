import { StageProps, Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CdkWorkshopStack, CdkWorkshopStackOutput } from "./cdk-workshop-stack";

export class WorkshopPipelineStage extends Stage {
  public readonly output: CdkWorkshopStackOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const workshopStack = new CdkWorkshopStack(this, "WebService");
    this.output = workshopStack.output;
  }
}
