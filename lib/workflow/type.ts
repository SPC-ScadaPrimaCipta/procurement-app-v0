export type WorkflowResolverContext = {
	workflowInstanceId: string;
	workflowId: string;
	submitterId: string;
	refType: string;
	refId: string;
	previousStepId?: string;
};
