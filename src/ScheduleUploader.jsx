import React, { useState } from "react";
import * as XLSX from "xlsx";

function formatDateTitle(raw) {
  return raw
    // .replace(/^Jadwal Tayang:\s*/i, "") // Remove the prefix
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize each word
    .trim();
}

function excelTimeToString(excelTime) {
  const totalSeconds = Math.round(excelTime * 24 * 60 * 60); // convert to seconds
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  // const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  // return `${hours}:${minutes}:${seconds}`;
  return `${hours}:${minutes}`;
}

function formatTitle(raw) {
  return raw
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\d{6}\b/g, "") // Remove 6-digit numbers
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize each word
    .replace(/\s+/g, " ") // Remove extra spaces
    .trim(); // Trim leading/trailing spaces
}


function ScheduleUploader() {
  const [schedules, setSchedules] = useState([]);
  const [dateInfo, setDateInfo] = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract the date from A3
      const dateCell = sheet["A3"];
      if (dateCell && dateCell.v) {
        const match = dateCell.v.match(/TAYANG\s*:\s*(.*)/);
        if (match) setDateInfo(match[1]);
      }

      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        range: 5, // Skip first 5 rows
        header: "A",
        defval: "",
      });

      const cleaned = jsonData
        .filter((row) => {
          const remarks = row["R"]?.toLowerCase() || "";
          const programTitle = row["D"]?.toLowerCase() || "";
          const isFiller = ["filler", "station id"].includes(remarks) || (programTitle.slice(0,6) === "filler")
          console.log(remarks, programTitle, isFiller)
          return !isFiller;
        })
        .map((row) => ({
          scheduleIn: row["B"],
          title: row["D"],
        }))
        .filter((item) => item.scheduleIn && item.title);

      setSchedules(cleaned);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload Jadwal Acara</h2>
      <input type="file" accept=".xlsx" onChange={handleFile} />

      {dateInfo && (
        <div className="mt-4 text-gray-600">
          {formatDateTitle(dateInfo)}
        </div>
      )}

      <div className="grid gap-3 mt-6">
        {schedules.map((item, index) => (
          <div
            key={index}
            className="border rounded-xl p-4 shadow bg-white hover:shadow-md transition"
          >
            <div className="text-sm text-gray-500">
              {`${excelTimeToString(item.scheduleIn)} - ${formatTitle(item.title)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScheduleUploader;
