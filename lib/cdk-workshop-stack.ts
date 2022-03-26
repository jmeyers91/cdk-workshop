import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { TableViewer } from "cdk-dynamo-table-viewer";
import { HitCounter } from "./hitcounter";

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
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
    new apigw.LambdaRestApi(this, "Endpoint", {
      handler: helloWithCounter.handler,
    });

    /**
     * Creates a lambda webpage that displays the hit counter table data.
     * The page is publicly accessable and not meant for production use.
     * The URL will be available in the CLI outputs after running `cdk deploy`.
     */
    new TableViewer(this, "ViewHitCounter", {
      title: "Hello Hits",
      table: helloWithCounter.table,
      sortBy: "-hits",
    });
  }
}
