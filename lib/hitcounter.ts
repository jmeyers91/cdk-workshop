import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";

export const MIN_READ_CAPACITY = 5;
export const MAX_READ_CAPACITY = 20;
export interface HitCounterProps {
  downstream: lambda.IFunction;

  /**
   * DynamoDB table read capacity.
   * Must be greater than `MIN_READ_CAPACITY` and lower than `MAX_READ_CAPACITY`.
   *
   * @default MIN_READ_CAPACITY
   */
  readCapacity?: number;
}

export class HitCounter extends Construct {
  public readonly handler: lambda.Function;
  public readonly table: dynamodb.Table;

  constructor(
    scope: Construct,
    id: string,
    { downstream, readCapacity = MIN_READ_CAPACITY }: HitCounterProps
  ) {
    super(scope, id);

    if (readCapacity < MIN_READ_CAPACITY || readCapacity > MAX_READ_CAPACITY) {
      throw new Error(
        `readCapacity must be between ${MIN_READ_CAPACITY} and ${MAX_READ_CAPACITY}.`
      );
    }

    this.table = new dynamodb.Table(this, "Hits", {
      partitionKey: { name: "path", type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      readCapacity: readCapacity ?? 5,
    });

    this.handler = new lambda.Function(this, "HitCounterHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "hitcounter.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        DOWNSTREAM_FUNCTION_NAME: downstream.functionName,
        HITS_TABLE_NAME: this.table.tableName,
      },
    });

    this.table.grantReadWriteData(this.handler);

    downstream.grantInvoke(this.handler);
  }
}
