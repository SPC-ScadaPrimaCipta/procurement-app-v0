export const APPROVER_STRATEGIES = [
	{
		value: "USER",
		label: "User",
		description:
			"Assign approval to a single specific user. Expects a User ID.",
		example: "e.g. 'cm4...'",
	},
	{
		value: "ROLE",
		label: "Role",
		description:
			"Assign approval to any user with a specific role. Expects a Role Code.",
		example: "e.g. 'MANAGER', 'FINANCE'",
	},
	{
		value: "DYNAMIC",
		label: "Dynamic",
		description:
			"Use logic to find approver at runtime (e.g. submitter's manager). Expects a Resolver Key.",
		example: "e.g. 'MANAGER_OF_SUBMITTER'",
	},
];

export const APPROVAL_MODES = [
	{
		value: "ANY",
		label: "Any (One approval required)",
		description:
			"The step moves forward as soon as one person approves. Good for 'first responder' scenarios.",
	},
	{
		value: "ALL",
		label: "All (Consensus required)",
		description:
			"Every assigned approver must approve before the step moves forward. Good for strict compliance.",
	},
];

export const REJECT_TARGET_TYPES = [
	{
		value: "PREVIOUS",
		label: "Previous Step",
		description:
			"Return the request to the step immediately preceding this one.",
	},
	{
		value: "SUBMITTER",
		label: "Submitter",
		description:
			"Return the request all the way back to the original submitter.",
	},
	{
		value: "SPECIFIC",
		label: "Specific Step ID",
		description:
			"Return the request to a specific step defined by its UUID.",
	},
	{
		value: "RUNTIME",
		label: "Dynamic",
		description:
			"Sendback decided by the step approver. Approver can choose who to sendback to.",
	},
];
