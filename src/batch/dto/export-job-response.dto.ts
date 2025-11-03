import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ExportJobResponse {
  @Field(() => String, { description: 'The job ID for tracking the export process' })
  jobId: string;

  @Field(() => String, { description: 'Status message about the export job' })
  message: string;
}