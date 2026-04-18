"use client";

import { useEffect, useState } from "react";

type JobIdType = string | { $oid: string };

interface Job {
  _id: JobIdType;
  event_id: string;
  job_id: string;
  status: "SUBMITTED" | "COMPLETED" | "FAILED";
  user_email: string;
  llm: string;
  task: string;
  criteria_data?: {
    tested_party_name: string;
    services_provided: string;
    functions_accept: string;
    functions_reject: string;
  };
  source_file: string;
}

interface JobCardsProps {
  userEmail: string;
  task: string;
}

const parseObjectIdDate = (id: JobIdType): Date | null => {
  const oid = typeof id === "string" ? id : id?.$oid;
  if (!oid || !/^[0-9a-fA-F]{24}$/.test(oid)) {
    return null;
  }

  const timestamp = parseInt(oid.substring(0, 8), 16) * 1000;
  return new Date(timestamp);
};

const parseEventDate = (eventId: string): Date | null => {
  if (!eventId) {
    return null;
  }

  const numeric = Number(eventId);
  if (Number.isNaN(numeric)) {
    return null;
  }

  if (eventId.length === 10) {
    return new Date(numeric * 1000);
  }

  if (eventId.length >= 13) {
    return new Date(numeric);
  }

  return null;
};

const getJobDateLabel = (job: Job) => {
  const eventDate = parseEventDate(job.event_id);
  if (eventDate && !Number.isNaN(eventDate.getTime())) {
    return eventDate.toLocaleDateString();
  }

  const objectIdDate = parseObjectIdDate(job._id);
  if (objectIdDate && !Number.isNaN(objectIdDate.getTime())) {
    return objectIdDate.toLocaleDateString();
  }

  return "Unknown date";
};

const getJobKey = (id: JobIdType) => {
  return typeof id === "string" ? id : id?.$oid ?? "unknown-job";
};

const extractBatchName = (sourceFile: string): string => {
  // Format: <task>_<LLM>_<user_email>_<job_id>_<file_name>.xlsx
  const parts = sourceFile.split('_');
  if (parts.length >= 5) {
    // Take everything from index 4 onwards and remove .xlsx extension
    const fileNameWithExt = parts.slice(4).join('_');
    return fileNameWithExt.replace(/\.xlsx$/, '');
  }
  return sourceFile; // fallback
};

export default function JobCards({ userEmail, task }: JobCardsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/jobs?userEmail=${encodeURIComponent(userEmail)}&task=${encodeURIComponent(task)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const data = await response.json();
        setJobs(data.jobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    if (userEmail && task) {
      fetchJobs();
    }
  }, [userEmail, task]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "border-blue-500 bg-blue-50";
      case "COMPLETED":
        return "border-green-500 bg-green-50";
      case "FAILED":
        return "border-red-500 bg-red-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "text-blue-700";
      case "COMPLETED":
        return "text-green-700";
      case "FAILED":
        return "text-red-700";
      default:
        return "text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-700">Recent Jobs</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-700">Recent Jobs</h2>
        <div className="text-center py-8">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4 text-slate-700">Recent Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-gray-500 italic">No jobs found yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={getJobKey(job._id)}
              className={`p-4 rounded-lg border-2 ${getStatusColor(job.status)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 truncate">
                    {job.task === "webcrawler"
                      ? extractBatchName(job.source_file)
                      : job.criteria_data?.tested_party_name || "Unknown party"
                    }
                  </h3>
                  
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusTextColor(job.status)} bg-white`}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>LLM:</strong> {job.llm}</p>
                <p><strong>Date:</strong> {getJobDateLabel(job)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}