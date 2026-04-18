"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import DispositionFileUpload from "@/components/DispositionFileUpload";
import JobCards from "@/components/JobCards";
import { useSession } from "next-auth/react";

export default function DispositionPage() {
    const [llm, setLlm] = useState("gemini");
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();

    const config = {
        cells: {
            tested_party_name_cell: "A1",
            services_provided_cell: "A4",
            functions_accept_cell: "A6",
            functions_reject_cell: "A8",
            table_header_row: 10,
        },
        requiredColumns: ["Company Name", "Geographic Locations", "Business Description"]
    };

    const validateFormat = async (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Use array buffer for better compatibility with xlsx
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];

                    // Check metadata cells (A1, A4, A6, A8)
                    const getVal = (cell: string) => sheet[cell]?.v;
                    const criteria = {
                        name: getVal(config.cells.tested_party_name_cell),
                        services: getVal(config.cells.services_provided_cell),
                        accept: getVal(config.cells.functions_accept_cell),
                        reject: getVal(config.cells.functions_reject_cell),
                    };

                    if (!criteria.name || !criteria.services || !criteria.accept || !criteria.reject) {
                        setError("Format Error: Critical configuration cells (A1, A4, A6, or A8) are empty.");
                        return resolve(false);
                    }

                    // Check headers at row 10
                    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { 
                        header: 1, 
                        range: config.cells.table_header_row - 1 
                    });
                    const headers = rows[0] || [];
                    
                    const missing = config.requiredColumns.filter(col => !headers.includes(col));
                    if (missing.length > 0) {
                        setError(`Missing columns: ${missing.join(", ")}. Ensure headers are on row ${config.cells.table_header_row}.`);
                        return resolve(false);
                    }

                    // Check that there is at least one row of data after headers
                    if (rows.length < 2) {
                        setError("No data found. Ensure data rows exist after the headers on row 10.");
                        return resolve(false);
                    }

                    setError(null);
                    resolve(true);
                } catch (err) {
                    setError("Could not parse Excel file. Please ensure it is a valid .xlsx file.");
                    resolve(false);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Disposition Tool</h1>
                <p className="text-gray-600">Advanced AI-driven data processing.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 max-w-2xl">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select LLM Engine</label>
                    <div className="flex gap-4">
                        {["gemini", "gpt-oss"].map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    setLlm(option);
                                    setError(null); // Clear error when switching LLMs
                                }}
                                className={`px-4 py-2 rounded-lg border transition ${
                                    llm === option ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                                }`}
                            >
                                {option === "gemini" ? "Google Gemini" : "GPT-OSS (Custom)"}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {/* Using the specialized Disposition Component */}
                <DispositionFileUpload
                    task="disposition"
                    llm={llm as "gemini" | "gpt-oss"}
                    userEmail={session?.user?.email || ""}
                    onValidate={validateFormat}
                    onError={(error) => setError(error)}
                />
            </div>

            <JobCards userEmail={session?.user?.email || ""} task="disposition" />
        </div>
    );
}