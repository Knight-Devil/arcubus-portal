"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import FileUpload from "@/components/FileUpload";
import JobCards from "@/components/JobCards";
import { useSession } from "next-auth/react";

export default function CrawlerPage() {
    const { data: session } = useSession();

    const [error, setError] = useState<string | null>(null);
    const [llm, setLlm] = useState<"gemini" | "gpt-oss">("gemini");

    const requiredColumns = ["Company Name", "Website"];

    const validateFormat = async (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];

                    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
                        header: 1
                    });

                    const headers = rows[0] || [];

                    const missing = requiredColumns.filter(col => !headers.includes(col));

                    if (missing.length > 0) {
                        setError(`Missing columns: ${missing.join(", ")}`);
                        return resolve(false);
                    }

                    setError(null);
                    resolve(true);

                } catch (err) {
                    setError("Invalid Excel file format.");
                    resolve(false);
                }
            };

            reader.readAsArrayBuffer(file);
        });
    };

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Crawler Dashboard</h1>
                <p className="text-gray-600">
                    Upload your target URLs via Excel to start the crawl process.
                </p>
            </header>

            <div className="space-y-8">

                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4 text-slate-700">
                        Upload New Task
                    </h2>

                    {/* ✅ LLM Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select LLM Engine
                        </label>

                        <div className="flex gap-4">
                            {["gemini", "gpt-oss"].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        setLlm(option as "gemini" | "gpt-oss");
                                        setError(null);
                                    }}
                                    className={`px-4 py-2 rounded-lg border transition ${
                                        llm === option
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                                    }`}
                                >
                                    {option === "gemini"
                                        ? "Google Gemini"
                                        : "GPT-OSS (Custom)"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ❌ Error Display */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* ✅ Upload Component */}
                    <FileUpload
                        task="webcrawler"
                        llm={llm}
                        userEmail={session?.user?.email || ""}
                        accept=".xlsx"
                        onValidate={validateFormat}
                    />
                </div>

                <JobCards userEmail={session?.user?.email || ""} task="webcrawler" />

            </div>
        </div>
    );
}