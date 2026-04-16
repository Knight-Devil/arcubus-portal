"use client";

import React, { useState } from "react";
import DispositionFormModal from "@/components/DispositionFormModal";
import {
  reformatDispositionFile,
  DispositionFormData,
} from "@/lib/disposition-utils";

interface DispositionFileUploadProps {
  llm: "gemini" | "gpt-oss";
  userEmail: string;
  onValidate: (file: File) => Promise<boolean>;
  onError?: (error: string) => void;
}

export default function DispositionFileUpload({
  llm,
  userEmail,
  onValidate,
  onError,
}: DispositionFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialTestedPartyName, setInitialTestedPartyName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Handle file selection - show form instead of immediately uploading
  const handleFileSelect = async (file: File) => {
    try {
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false); // Clear success state when selecting new file

      // Don't extract party name from file - user will input it manually
      setInitialTestedPartyName("");

      // Show the form modal
      setShowForm(true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error reading file";
      setUploadError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData: DispositionFormData) => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setUploadError(null);

      // Reformat the file based on form data
      const reformattedFile = await reformatDispositionFile(
        selectedFile,
        formData
      );

      // Validate the reformatted file
      const isValid = await onValidate(reformattedFile);
      if (!isValid) {
        // Error is already set by the validate function
        return;
      }

      // Upload the reformatted file using the FileUpload component logic
      await uploadReformattedFile(reformattedFile);

      // Close modal and show success
      setShowForm(false);
      setSelectedFile(null);
      setUploadSuccess(true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error processing file";
      setUploadError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload the reformatted file to GCS
  const uploadReformattedFile = async (file: File) => {
    try {
      const contentType =
        file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const fileName = `disposition_${llm}_${userEmail}_${Date.now()}_${file.name}`;

      // Get signed URL
      const res = await fetch("/api/gcs/get-signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          contentType,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { url } = await res.json();

      // Upload to GCS
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": contentType,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* File Selection UI */}
        <div className="flex items-center space-x-4">
          <input
            id="disposition-file-upload"
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
            className="hidden"
          />
          <label
            htmlFor="disposition-file-upload"
            className="cursor-pointer py-2 px-4 rounded-full border-0 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
          >
            Choose File
          </label>
          {selectedFile && (
            <span className="text-sm text-gray-700">{selectedFile.name}</span>
          )}
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            ❌ {uploadError}
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
            ✅ Uploaded successfully!
          </div>
        )}
      </div>

      {/* Form Modal */}
      <DispositionFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedFile(null);
          setUploadSuccess(false); // Clear success state on modal close
          // Reset file input
          const input = document.getElementById(
            "disposition-file-upload"
          ) as HTMLInputElement;
          if (input) input.value = "";
        }}
        onSubmit={handleFormSubmit}
        initialTestedPartyName={initialTestedPartyName}
        isLoading={isProcessing}
      />
    </>
  );
}
