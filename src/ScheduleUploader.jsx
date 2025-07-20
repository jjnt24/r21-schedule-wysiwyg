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

  const excelTimeToString = (excelTime) => {
    const totalSeconds = Math.round(excelTime * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatTitle = (raw) =>
    raw
      .replace(/_/g, " ")
      .replace(/\b\d{6}\b/g, "")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();

  const formatDateTitle = (raw) =>
    raw.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()).trim();

  const handleCopy = () => {
    const css = `
<style>
  body {
    font-family: Arial, sans-serif;
    color: #600000;
  }
  .result-card {
    background-color: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    max-width: 700px;
    margin: 2rem auto;
  }
  .schedule-date {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
  }
  .schedule-item {
    padding: 0.5rem 0.75rem;
    border: 1px solid #eee;
    border-radius: 6px;
    background-color: #fdfdfd;
    margin-bottom: 0.5rem;
  }
</style>
`;

    const html = `
<div class="result-card">
  ${scheduleGroups
    .map(
      (group) => `
    <div class="schedule-group">
      <h3 class="schedule-date">${group.date}</h3>
      ${group.data
        .map(
          (item) => `
        <div class="schedule-item">
          ${excelTimeToString(item.scheduleIn)} - ${formatTitle(item.title)}
        </div>
      `
        )
        .join("")}
    </div>
  `
    )
    .join("")}
</div>
`;

    navigator.clipboard.writeText(css + html).then(() => {
      alert("Copied schedule HTML + CSS to clipboard!");
    });
  };

  const handleDownload = () => {
  const css = `
<style>
  body {
    font-family: Arial, sans-serif;
    color: #600000;
  }
  .result-card {
    background-color: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    max-width: 700px;
    margin: 2rem auto;
  }
  .schedule-date {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
  }
  .schedule-item {
    padding: 0.5rem 0.75rem;
    border: 1px solid #eee;
    border-radius: 6px;
    background-color: #fdfdfd;
    margin-bottom: 0.5rem;
  }
</style>
`;

  const html = `
<div class="result-card">
  ${scheduleGroups
    .map(
      (group) => `
    <div class="schedule-group">
      <h3 class="schedule-date">${group.date}</h3>
      ${group.data
        .map(
          (item) => `
        <div class="schedule-item">
          ${excelTimeToString(item.scheduleIn)} - ${formatTitle(item.title)}
        </div>
      `
        )
        .join("")}
    </div>
  `
    )
    .join("")}
</div>
`;

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Schedule Export</title>${css}</head><body>${html}</body></html>`;

  const blob = new Blob([fullHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "schedule.html";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


  return (
    <div className="schedule-uploader">
      <h2 className="title">Upload Jadwal Acara (Multi-file)</h2>
      <input type="file" accept=".xlsx" multiple onChange={handleFiles} />

      {scheduleGroups.length > 0 && (
        <div className="result-card-wrapper">
           <div className="button-group">
            <button className="copy-button" onClick={handleCopy}>Copy to Clipboard</button>
            <button className="download-button" onClick={handleDownload}>Download as .html</button>
          </div>
          
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
        </div>
      )}
    </div>
  );
}

export default ScheduleUploader;
