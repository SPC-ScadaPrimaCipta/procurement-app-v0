export type DynamicResolverKey =
	| "MANAGER_OF_SUBMITTER"
	| "PIC_SELECTED"
	| "FIELD_SUPERVISOR";

export const DYNAMIC_RESOLVERS = {
	MANAGER_OF_SUBMITTER: {
		label: "Manager of Submitter",
		description: "Immediate manager of the user who submitted the workflow",
		requiredContext: ["submitterId"],
	},

	PIC_SELECTED: {
		label: "PIC selected in previous step",
		description: "User selected by approver in the previous step",
		requiredContext: ["workflowInstanceId"],
	},

	FIELD_SUPERVISOR: {
		label: "Supervisor of selected field",
		description: "Supervisor determined by form field value",
		requiredContext: ["refType", "refId"],
	},
} as const;
