import * as cdk from "aws-cdk-lib";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { WorkshopPipelineStage } from "./pipeline-stage";

export class WorkshopPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "WorkshopPipeline",
      synth: new CodeBuildStep("SynthStep", {
        input: CodePipelineSource.gitHub("jmeyers91/cdk-workshop", "main", {
          authentication: cdk.SecretValue.secretsManager("github-token"),
        }),
        installCommands: ["npm install -g aws-cdk", "npm ci"],
        commands: ["./build.sh"],
      }),
    });

    const deploy = new WorkshopPipelineStage(this, "Deploy");
    const deployStage = pipeline.addStage(deploy);

    deployStage.addPost(
      new CodeBuildStep("TestViewerEndpoint", {
        projectName: "TestViewerEndpoint",
        envFromCfnOutputs: {
          ENDPOINT_URL: deploy.output.tableViewerUrl,
        },
        commands: ["curl -Ssf $ENDPOINT_URL"],
      }),

      new CodeBuildStep("TestApiGatewayEndpoint", {
        projectName: "TestApiGatewayEndpoint",
        envFromCfnOutputs: {
          ENDPOINT_URL: deploy.output.gatewayUrl,
        },
        commands: [
          "curl -Ssf $ENDPOINT_URL",
          "curl -Ssf $ENDPOINT_URL/cool",
          "curl -Ssf $ENDPOINT_URL/beans",
        ],
      })
    );
  }
}
