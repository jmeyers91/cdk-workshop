import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface HitCounterProps {
  downstream: lambda.IFunction;
}

export class HitCounter extends Construct {
  public readonly handler: lambda.Function;
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: HitCounterProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, "Hits", {
      partitionKey: { name: "path", type: dynamodb.AttributeType.STRING },
    });

    this.handler = new lambda.Function(this, "HitCounterHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "hitcounter.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
        HITS_TABLE_NAME: this.table.tableName,
      },
    });

    this.table.grantReadWriteData(this.handler);

    props.downstream.grantInvoke(this.handler);
  }
}
