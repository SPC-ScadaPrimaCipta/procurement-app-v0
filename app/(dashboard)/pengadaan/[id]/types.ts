export interface DocumentFile {
	id: string;
	file_name: string;
	file_url: string | null;
}

export interface Document {
	id: string;
	title: string | null;
	doc_number: string | null;
	created_at: string;
	master_doc_type: {
		name: string;
	};
	document_file: DocumentFile[];
}

export interface CorrespondenceIn {
	id: string;
	letter_number: string;
	letter_date: string;
	from_name: string;
	subject: string;
	received_date: string;
	created_by_name?: string;
}

export interface CorrespondenceOut {
	id: string;
	letter_number: string;
	letter_date: string;
	to_name: string;
	subject: string;
	created_by_name?: string;
}

export interface Contract {
	id: string;
	contract_number: string;
	contract_date: string;
	vendor: {
		vendor_name: string;
	} | null;
	contract_value: number;
	start_date: string;
	end_date: string;
	work_description: string;
	contract_status: {
		name: string;
	};
}

export interface ProcurementCaseDetail {
	id: string;
	case_code: string | null;
	title: string;
	created_at: string;
	created_by_name: string;
	status: {
		name: string;
	};
	unit: {
		unit_name: string;
	} | null;
	correspondence_in: CorrespondenceIn | null;
	correspondence_out: CorrespondenceOut[];
	contract: Contract | null;
	document: Document[];
	case_disposition_summary: {
		agenda_scope?: string | null;
		agenda_number?: string | null;
		disposition_actions?: string[];
		disposition_note: string | null;
		disposition_date: string | null;
		forward_to?: {
			recipient: {
				id: string;
				name: string;
			};
		}[];
	} | null;
	currentStepInstanceId?: string | null;
	workflow_track?: WorkflowTrackItem[];
}

export interface WorkflowTrackItem {
	stepNumber: number;
	title: string;
	approverName: string;
	status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
	approvedAt?: string | null;
	isLast: boolean;
}
