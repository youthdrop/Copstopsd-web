import { useEffect, useRef, useState } from "react";
import { api, ComplaintDocument, ComplaintDocumentSection } from "../lib/api";

type Props = {
  complaintId: number;
  section: ComplaintDocumentSection;
};

function formatBytes(value?: number | null) {
  if (!value || value < 1) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ComplaintDocumentsSection({ complaintId, section }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<ComplaintDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    setError("");
    try {
      const rows = await api.listComplaintDocuments(complaintId, section);
      setDocuments(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId, section]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;

    const selectedFiles = Array.from(files);

    setUploading(true);
    setError("");
    setMessage("");

    let uploadedCount = 0;
    const failedFiles: string[] = [];

    try {
      for (const file of selectedFiles) {
        if (file.size > 25 * 1024 * 1024) {
          failedFiles.push(`${file.name}: larger than the 25 MB limit`);
          continue;
        }

        try {
          await api.uploadComplaintDocument(complaintId, section, file);
          uploadedCount += 1;
        } catch (e: any) {
          const reason = e?.message || "upload failed";
          failedFiles.push(`${file.name}: ${reason}`);
        }
      }

      await loadDocuments();

      if (uploadedCount > 0) {
        setMessage(
          uploadedCount === 1
            ? "1 document uploaded."
            : `${uploadedCount} documents uploaded.`
        );
      }

      if (failedFiles.length > 0) {
        setError(`Could not upload: ${failedFiles.join("; ")}`);
      }
    } finally {
      // Always clear the browser file selection, even when one file fails.
      if (inputRef.current) inputRef.current.value = "";
      setUploading(false);
    }
  }

  function clearSelectedFiles() {
    if (inputRef.current) inputRef.current.value = "";
    setError("");
    setMessage("");
  }

  async function downloadDocument(document: ComplaintDocument) {
    setError("");
    try {
      const blob = await api.downloadComplaintDocument(document.id);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.original_filename;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Download failed");
    }
  }

  async function deleteDocument(document: ComplaintDocument) {
    const confirmed = window.confirm(`Delete ${document.original_filename}?`);
    if (!confirmed) return;

    setDeletingId(document.id);
    setError("");
    setMessage("");

    try {
      await api.deleteComplaintDocument(document.id);
      setDocuments((previous) => previous.filter((item) => item.id !== document.id));
      setMessage("Document deleted.");
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="border-t pt-4 space-y-3">
      <div>
        <div className="text-sm font-semibold">Documents</div>
        <div className="text-xs text-gray-500">
          Add one or more PDFs, images, audio files, videos, Word documents, or other supporting files.
          Maximum 25 MB per file.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="block text-sm"
          onChange={(event) => uploadFiles(event.target.files)}
          disabled={uploading}
        />
        <button
          type="button"
          className="px-3 py-2 border rounded-xl text-sm"
          onClick={clearSelectedFiles}
          disabled={uploading}
        >
          Clear Selection
        </button>
        {uploading ? <span className="text-sm text-gray-600">Uploading…</span> : null}
      </div>

      {message ? <div className="text-sm text-green-700">{message}</div> : null}
      {error ? <div className="text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="text-sm text-gray-500">Loading documents…</div>
      ) : documents.length === 0 ? (
        <div className="text-sm text-gray-500">No documents uploaded in this section.</div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-3"
            >
              <div className="min-w-0">
                <div className="font-medium break-all">{document.original_filename}</div>
                <div className="text-xs text-gray-500">
                  {document.content_type || "File"}
                  {document.file_size ? ` • ${formatBytes(document.file_size)}` : ""}
                  {document.created_at
                    ? ` • ${new Date(document.created_at).toLocaleString()}`
                    : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 border rounded-xl text-sm"
                  onClick={() => downloadDocument(document)}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="px-3 py-2 border rounded-xl text-sm text-red-700"
                  disabled={deletingId === document.id}
                  onClick={() => deleteDocument(document)}
                >
                  {deletingId === document.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
