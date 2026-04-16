"use client";

import React, { useState } from "react";
import { DispositionFormData } from "@/lib/disposition-utils";

interface DispositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: DispositionFormData) => Promise<void>;
  initialTestedPartyName?: string;
  isLoading?: boolean;
}

export default function DispositionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialTestedPartyName = "",
  isLoading = false,
}: DispositionFormModalProps) {
  const [formData, setFormData] = useState<DispositionFormData>({
    testedPartyName: initialTestedPartyName,
    functionsPerformed: "",
    functionsAccept: "",
    functionsReject: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof DispositionFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.testedPartyName.trim()) {
      setError("Tested party name is required");
      return;
    }
    if (!formData.functionsPerformed.trim()) {
      setError("Functions performed is required");
      return;
    }
    if (!formData.functionsAccept.trim()) {
      setError("Functions to accept is required");
      return;
    }
    if (!formData.functionsReject.trim()) {
      setError("Functions to reject is required");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">File Information</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Tested Party Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tested Party Name *
            </label>
            <input
              type="text"
              value={formData.testedPartyName}
              onChange={(e) => handleChange("testedPartyName", e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter tested party name"
            />
          </div>

          {/* Functions Performed */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Functions Performed by the Tested Party *
            </label>
            <textarea
              value={formData.functionsPerformed}
              onChange={(e) => handleChange("functionsPerformed", e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter functions performed"
              rows={2}
            />
          </div>

          {/* Functions to Accept */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Functions to be Accepted *
            </label>
            <textarea
              value={formData.functionsAccept}
              onChange={(e) => handleChange("functionsAccept", e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter functions to be accepted"
              rows={2}
            />
          </div>

          {/* Functions to Reject */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Functions to be Rejected *
            </label>
            <textarea
              value={formData.functionsReject}
              onChange={(e) => handleChange("functionsReject", e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter functions to be rejected"
              rows={2}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {isLoading ? "Processing..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
