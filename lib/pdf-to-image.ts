"use client";

/**
 * Convert PDF first page to image file (client-side only)
 */
export async function convertPdfToImage(pdfFile: File): Promise<File> {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");
    
    // Set worker from public folder
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Get first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 3.0 }); // 3x for higher quality OCR (increased from 2.0)
        
        // Create canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (!context) {
            throw new Error("Failed to get canvas context");
        }
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas as any,
        }).promise;
        
        // Convert canvas to blob with maximum quality
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to convert canvas to blob"));
                },
                "image/jpeg",
                1.0 // Maximum quality (increased from 0.95)
            );
        });
        
        // Create File from blob
        const fileName = pdfFile.name.replace(/\.pdf$/i, ".jpg");
        const imageFile = new File([blob], fileName, { type: "image/jpeg" });
        
        return imageFile;
    } catch (error) {
        console.error("PDF to image conversion error:", error);
        throw new Error("Failed to convert PDF to image. Please try with JPG/PNG file.");
    }
}
