import React, { useState } from "react";
import * as XLSX from "xlsx";
import './ScheduleUploader.css';

function formatDateTitle(raw) {
  return raw
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function excelTimeToString(excelTime) {
  const totalSeconds = Math.round(excelTime * 24 * 60 * 60);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatTitle(raw) {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\d{6}\b/g, "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function ScheduleUploader() {
  const [scheduleGroups, setScheduleGroups] = useState([]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);

    const results = await Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const dateCell = sheet["A3"];
            let dateLabel = "Unknown Date";
            if (dateCell && dateCell.v) {
              const match = dateCell.v.match(/TAYANG\s*:\s*(.*)/i);
              if (match) dateLabel = formatDateTitle(match[1]);
            }

            const jsonData = XLSX.utils.sheet_to_json(sheet, {
              range: 5,
              header: "A",
              defval: "",
            });

            const cleaned = jsonData
              .filter((row) => {
                const remarks = row["R"]?.toLowerCase() || "";
                const programTitle = row["D"]?.toLowerCase() || "";
                const isFiller =
                  ["filler", "station id"].includes(remarks) ||
                  programTitle.startsWith("filler");
                return !isFiller;
              })
              .map((row) => ({
                scheduleIn: row["B"],
                title: row["D"],
              }))
              .filter((item) => item.scheduleIn && item.title);

            resolve({ date: dateLabel, data: cleaned });
          };

          reader.readAsArrayBuffer(file);
        });
      })
    );

    setScheduleGroups(results);
  };

  return (
    <div className="schedule-uploader">
      <h2 className="title">Upload Jadwal Acara (Multi-file)</h2>
      <input type="file" accept=".xlsx" multiple onChange={handleFiles} />

      {scheduleGroups.length > 0 && (
        <div className="result-card">
          {scheduleGroups.map((group, idx) => (
            <div key={idx} className="schedule-group">
              <h3 className="schedule-date">{group.date}</h3>
              <div className="schedule-list">
                {group.data.map((item, index) => (
                  <div key={index} className="schedule-item">
                    {`${excelTimeToString(item.scheduleIn)} - ${formatTitle(item.title)}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScheduleUploader;
