import { useEffect, useRef, useState } from "react";
import { api, ComplaintDocument, ComplaintDocumentSection } from "../lib/api";

type Props = {
  complaintId: number;
  section: ComplaintDocumentSection;
};

type UploadRow = {
  key: string;
  filename: string;
  progress: number;
  status: "waiting" | "uploading" | "complete" | "failed";
  error?: string;
};

function formatBytes(value?: number | null) {
  if (!value || value < 1) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function putFileWithProgress(
  uploadUrl: string,
  headers: Record<string, string>,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);

    Object.entries(headers || {}).forEach(([name, value]) => {
      xhr.setRequestHeader(name, value);
    });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Bucket upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Bucket upload connection failed"));
    xhr.onabort = () => reject(new Error("Upload was cancelled"));
    xhr.send(file);
  });
}

export default function ComplaintDocumentsSection({
  complaintId,
  section,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<ComplaintDocument[]>([]);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
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

  function updateUpload(key: string, patch: Partial<UploadRow>) {
    setUploads((previous) =>
      previous.map((row) =>
        row.key === key ? { ...row, ...patch } : row
      )
    );
  }

  async function uploadOne(file: File, key: string) {
    try {
      updateUpload(key, { status: "uploading", progress: 0 });

      const ticket = await api.createComplaintUploadTicket(
        complaintId,
        section,
        file
      );

      await putFileWithProgress(
        ticket.upload_url,
        ticket.upload_headers,
        file,
        (progress) => updateUpload(key, { progress })
      );

      await api.completeComplaintUpload(ticket.document.id);

      updateUpload(key, {
        status: "complete",
        progress: 100,
      });

      return true;
    } catch (e: any) {
      updateUpload(key, {
        status: "failed",
        error: e?.message || "Upload failed",
      });
      return false;
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files);
    setError("");
    setMessage("");

    const rows: UploadRow[] = selected.map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      filename: file.name,
      progress: 0,
      status: "waiting",
    }));

    setUploads(rows);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    let successful = 0;

    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      const row = rows[index];

      if (file.size > 5 * 1024 * 1024 * 1024) {
        updateUpload(row.key, {
          status: "failed",
          error: "File exceeds the 5 GB limit.",
        });
        continue;
      }

      if (await uploadOne(file, row.key)) {
        successful += 1;
      }
    }

    await loadDocuments();

    if (successful > 0) {
      setMessage(
        successful === 1
          ? "1 document uploaded."
          : `${successful} documents uploaded.`
      );
    }
  }

  async function downloadDocument(document: ComplaintDocument) {
    setError("");

    try {
      const ticket = await api.getComplaintDownloadTicket(document.id);

      if (ticket.download_url.startsWith("/")) {
        window.location.assign(
          `${window.location.origin}${ticket.download_url}`
        );
      } else {
        window.location.assign(ticket.download_url);
      }
    } catch (e: any) {
      setError(e?.message || "Download failed");
    }
  }

  async function deleteDocument(document: ComplaintDocument) {
    const confirmed = window.confirm(
      `Delete ${document.original_filename}?`
    );
    if (!confirmed) return;

    setDeletingId(document.id);
    setError("");
    setMessage("");

    try {
      await api.deleteComplaintDocument(document.id);
      setDocuments((previous) =>
        previous.filter((item) => item.id !== document.id)
      );
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
          Files upload directly to private object storage. Multiple files and
          upload progress are supported.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="block text-sm"
          onChange={(event) => uploadFiles(event.target.files)}
        />

        <button
          type="button"
          className="px-3 py-2 border rounded-xl text-sm"
          onClick={() => {
            setUploads([]);
            setError("");
            setMessage("");
          }}
        >
          Clear
        </button>
      </div>

      {uploads.length > 0 ? (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.key}
              className="border rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium break-all">
                  {upload.filename}
                </div>

                <div className="text-xs text-gray-600">
                  {upload.status === "waiting" && "Waiting"}
                  {upload.status === "uploading" &&
                    `${upload.progress}%`}
                  {upload.status === "complete" && "Uploaded"}
                  {upload.status === "failed" && "Failed"}
                </div>
              </div>

              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-black transition-all"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>

              {upload.error ? (
                <div className="text-xs text-red-700">
                  {upload.error}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {message ? (
        <div className="text-sm text-green-700">{message}</div>
      ) : null}

      {error ? (
        <div className="text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-500">
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div className="text-sm text-gray-500">
          No documents uploaded in this section.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-3"
            >
              <div className="min-w-0">
                <div className="font-medium break-all">
                  {document.original_filename}
                </div>

                <div className="text-xs text-gray-500">
                  {document.content_type || "File"}
                  {document.file_size
                    ? ` • ${formatBytes(document.file_size)}`
                    : ""}
                  {document.storage_backend
                    ? ` • ${
                        document.storage_backend === "bucket"
                          ? "Object storage"
                          : "Legacy database"
                      }`
                    : ""}
                  {document.created_at
                    ? ` • ${new Date(
                        document.created_at
                      ).toLocaleString()}`
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
                  {deletingId === document.id
                    ? "Deleting…"
                    : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
