import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { TableViewer } from "cdk-dynamo-table-viewer";
import { HitCounter } from "./hitcounter";

export interface CdkWorkshopStackOutput {
  gatewayUrl: cdk.CfnOutput;
  tableViewerUrl: cdk.CfnOutput;
}

export class CdkWorkshopStack extends cdk.Stack {
  public readonly output: CdkWorkshopStackOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const helloLambda = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello.handler",
    });

    /**
     * Increments a counter in a DynamoDB table whenever `helloLambda` is invoked.
     */
    const helloWithCounter = new HitCounter(this, "HelloHitCounter", {
      downstream: helloLambda,
    });

    /**
     * Makes the hit counter lambda publicly accessable.
     * The URL will be available in the CLI outputs after running `cdk deploy`.
     */
    const lambdaGateway = new apigw.LambdaRestApi(this, "Endpoint", {
      handler: helloWithCounter.handler,
    });

    /**
     * Creates a lambda webpage that displays the hit counter table data.
     * The page is publicly accessable and not meant for production use.
     * The URL will be available in the CLI outputs after running `cdk deploy`.
     */
    const tableViewer = new TableViewer(this, "ViewHitCounter", {
      title: "Hello Hits",
      table: helloWithCounter.table,
      sortBy: "-hits",
    });

    this.output = {
      gatewayUrl: new cdk.CfnOutput(this, "gatewayUrl", {
        value: lambdaGateway.url,
      }),

      tableViewerUrl: new cdk.CfnOutput(this, "TableViewerUrl", {
        value: tableViewer.endpoint,
      }),
    };
  }
}
