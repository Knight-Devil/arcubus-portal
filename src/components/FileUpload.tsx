"use client";

import React, { useState } from "react";

interface FileUploadProps {
  task: "webcrawler" | "disposition";
  llm: "gemini" | "gpt-oss";
  userEmail: string;
  accept?: string;
  onValidate: (file: File) => Promise<boolean>;
}

export default function FileUpload({
  task,
  llm,
  userEmail,
  accept = ".xlsx",
  onValidate
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!file) return; // ✅ first check

    if (onValidate) {
        const isValid = await onValidate(file);
        if (!isValid) return;
        }

    setUploading(true);
    setSuccess(false);

    try {
      const contentType = file.type || "application/octet-stream";

      const fileName = `${task}_${llm}_${userEmail}_${Date.now()}_${file.name}`;

      const res = await fetch("/api/gcs/get-signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName,
          contentType
        })
      });

      const { url } = await res.json();

      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": contentType
        }
});

      console.log("UPLOAD STATUS:", uploadRes.status);
      console.log("UPLOAD TEXT:", await uploadRes.text());

      if (!uploadRes.ok) throw new Error("Upload failed");

      setSuccess(true);
      setFile(null);

    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setSuccess(false);
          }}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer py-2 px-4 rounded-full border-0 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
        >
          Choose File
        </label>
        {file && <span className="text-sm text-gray-700">{file.name}</span>}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {uploading ? "Uploading..." : "Upload & Process"}
      </button>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">
          ✅ Uploaded successfully!
        </div>
      )}
    </div>
  );
}