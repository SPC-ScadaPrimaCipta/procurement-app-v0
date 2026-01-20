import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChecklistUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	docTypeId: string;
	caseId: string;
	caseCode: string;
	onSuccess: () => void;
}

export function ChecklistUploadDialog({
	open,
	onOpenChange,
	title,
	docTypeId,
	caseId,
	caseCode,
	onSuccess,
}: ChecklistUploadDialogProps) {
	const [isUploading, setIsUploading] = useState(false);
	const { register, handleSubmit, reset } = useForm<{ file: FileList }>();

	const onSubmit = async (data: { file: FileList }) => {
		if (!data.file || data.file.length === 0) {
			toast.error("Pilih file terlebih dahulu");
			return;
		}

		const file = data.file[0];
		const formData = new FormData();
		formData.append("file", file);
		formData.append("ref_type", "PROCUREMENT_CASE");
		formData.append("ref_id", caseId);
		formData.append("doc_type_id", docTypeId);
		formData.append("folder_path", `Procurement/${caseCode}/${title}`);

		try {
			setIsUploading(true);
			const res = await fetch("/api/uploads", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				throw new Error("Upload failed");
			}

			toast.success("File berhasil diupload");
			onSuccess();
			onOpenChange(false);
			reset();
		} catch (error) {
			console.error(error);
			toast.error("Gagal mengupload file");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Upload Dokumen</DialogTitle>
					<DialogDescription>
						Upload file untuk memenuhi persyaratan: <b>{title}</b>
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="file">File</Label>
						<Input
							id="file"
							type="file"
							disabled={isUploading}
							{...register("file")}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isUploading}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isUploading}>
							{isUploading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<UploadCloud className="w-4 h-4 mr-2" />
									Upload
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
