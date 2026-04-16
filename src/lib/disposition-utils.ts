import * as XLSX from "xlsx";

export interface DispositionFormData {
  testedPartyName: string;
  functionsPerformed: string;
  functionsAccept: string;
  functionsReject: string;
}

/**
 * Reformats an uploaded disposition file to match the backend's expected format.
 * Input file: Headers in row 1, data from row 2
 * Output file: Metadata in rows 1-8, headers in row 10, data from row 11
 */
export async function reformatDispositionFile(
  file: File,
  formData: DispositionFormData
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sourceSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Read all data from source sheet starting from row 1 (headers in row 1, data from row 2)
        const sourceRows: any[][] = XLSX.utils.sheet_to_json(sourceSheet, {
          header: 1,
          range: 0, // Start from row 1 (0-indexed)
        });

        // Extract headers (first row) and data (remaining rows)
        const headers = sourceRows[0] || [];
        const dataRows = sourceRows.slice(1) || [];

        // Create a new workbook
        const newWorkbook = XLSX.utils.book_new();
        const newSheet: any = {};

        // Row 1: Tested Party Name (A1)
        newSheet["A1"] = { v: formData.testedPartyName, t: "s" };

        // Row 3: Functions Performed Header (A3)
        newSheet["A3"] = { v: "Functions performed by the Tested Party", t: "s" };
        // Row 4: Functions Performed Value (A4)
        newSheet["A4"] = { v: formData.functionsPerformed, t: "s" };

        // Row 5: Functions to Accept Header (A5)
        newSheet["A5"] = { v: "Functions to be accepted", t: "s" };
        // Row 6: Functions to Accept Value (A6)
        newSheet["A6"] = { v: formData.functionsAccept, t: "s" };

        // Row 7: Functions to Reject Header (A7)
        newSheet["A7"] = { v: "Functions to be rejected", t: "s" };
        // Row 8: Functions to Reject Value (A8)
        newSheet["A8"] = { v: formData.functionsReject, t: "s" };

        // Row 10: Original Headers (1-indexed, so row 10 is index 9)
        headers.forEach((header, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: 9, c: colIndex });
          newSheet[cellRef] = { v: header, t: "s" };
        });

        // Rows 11+: Original Data
        dataRows.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const cellRef = XLSX.utils.encode_cell({ r: 10 + rowIndex, c: colIndex });
            newSheet[cellRef] = { v: cell, t: "s" };
          });
        });

        // Calculate the range for the sheet
        const maxCol = Math.max(
          headers.length,
          dataRows.reduce((max, row) => Math.max(max, row.length), 0)
        );
        const maxRow = 10 + dataRows.length;
        const range = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol - 1 } });

        newSheet["!ref"] = range;

        XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");

        // Generate the file
        const wbout = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        // Create a new file with the original filename but reformatted content
        const reformattedFile = new File([blob], file.name, {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        resolve(reformattedFile);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}
