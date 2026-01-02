export type Workflow = {
	id: string;
	code: string;
	name: string;
	version: number;
	description: string | null;
	is_active: boolean;
	workflow_step: any[];
};
