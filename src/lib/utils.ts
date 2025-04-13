import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique ID for filenames
 * @param prefix Optional prefix for the ID
 * @returns A string with the format prefix-YYYYMMDD-HHMMSS-XXX where XXX is a random 3-digit number
 */
export function generateUniqueId(prefix: string = "transcript"): string {
  const now = new Date();

  // Format date as YYYYMMDD
  const date =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0");

  // Format time as HHMMSS
  const time =
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  // Generate a random 3-digit number
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${prefix}-${date}-${time}-${random}`;
}

/**
 * Formats a transcript for download as a text file
 * @param transcript Array of transcript items
 * @param title Optional title to include at the top of the file
 * @param format Format of the output (txt or pdf)
 * @returns Formatted string ready for download
 */
export function formatTranscriptForDownload(
  transcript: Array<{ text: string; duration?: number; offset?: number }>,
  title?: string,
  format: "txt" | "pdf" = "txt"
): string {
  // Get current date and time
  const timestamp = new Date().toLocaleString();

  // For both formats, we'll create the same text content
  // PDF formatting will be handled in the download function
  let content = "";

  // Add title if provided
  if (title) {
    content += `Title: ${title}\n`;
    content += "=".repeat(title.length + 7) + "\n\n";
  }

  // Add timestamp and format
  content += `Generated on: ${timestamp}\n\n`;

  // Add transcript content
  transcript.forEach((item, index) => {
    content += item.text + "\n";

    // Add a blank line between paragraphs for readability
    if ((index + 1) % 5 === 0) {
      content += "\n";
    }
  });

  return content;
}

/**
 * Downloads content as a file
 * @param content The text content to download
 * @param filename The name of the file without extension
 * @param format The format of the file (txt or pdf)
 */
export function downloadTextFile(
  content: string,
  filename: string,
  format: "txt" | "pdf" = "txt"
): void {
  if (format === "pdf") {
    // For PDF, we'll use a client-side PDF generation approach
    downloadAsPdf(content, filename);
    return;
  }

  // For TXT files
  const mimeType = "text/plain";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".txt") ? filename : `${filename}.txt`;

  // Append to the document, click, and remove
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generates and downloads a PDF file from text content
 * @param content The text content to include in the PDF
 * @param filename The name of the file without extension
 */
export function downloadAsPdf(content: string, filename: string): void {
  // Create a hidden iframe to render the PDF
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  // Get the iframe document and write the HTML content
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error("Could not access iframe document");
    return;
  }

  // Format the content with proper line breaks for HTML
  const formattedContent = content.replace(/\n/g, "<br>");

  // Create a simple HTML document with the content
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.5;
          margin: 30px;
        }
        .content {
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div class="content">${formattedContent}</div>
    </body>
    </html>
  `);
  iframeDoc.close();

  // Use the browser's print functionality to save as PDF
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up the iframe after printing dialog is shown
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 100);
  }, 500);
}
