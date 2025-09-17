"use client";

import { useState } from "react";
import {
  convertGoogleDriveUrl,
  extractGoogleDriveFileId,
} from "@/utils/googleDriveImageUtils";

export default function SimpleGoogleDriveUrlConverter() {
  const [inputUrl, setInputUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError("");
    setOutputUrl("");
    setCopied(false);

    if (!inputUrl.trim()) {
      setError("Please enter a Google Drive URL");
      return;
    }

    // Check if it's a Google Drive URL
    if (!inputUrl.includes("drive.google.com")) {
      setError("Please enter a valid Google Drive URL");
      return;
    }

    // Check if it's a sharing URL
    if (!inputUrl.includes("/file/d/") || !inputUrl.includes("/view")) {
      setError(
        "Please use a Google Drive sharing URL (should contain /file/d/ and /view)"
      );
      return;
    }

    const converted = convertGoogleDriveUrl(inputUrl);
    const fileId = extractGoogleDriveFileId(inputUrl);

    if (!fileId) {
      setError(
        "Could not extract file ID from URL. Please check the URL format."
      );
      return;
    }

    setOutputUrl(converted);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClear = () => {
    setInputUrl("");
    setOutputUrl("");
    setError("");
    setCopied(false);
  };

  return (
    <div>
      {/* Input Section */}
      <div className="mb-3">
        <label className="form-label fw-semibold">
          Google Drive Sharing URL
        </label>
        <div className="input-group">
          <input
            type="url"
            className="form-control"
            placeholder="https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleConvert()}
          />
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={handleClear}
            disabled={!inputUrl}
          >
            <i className="ti-close"></i>
          </button>
        </div>
        <div className="form-text">
          Paste your Google Drive sharing URL here (the one you get when you
          click "Share" → "Copy link")
        </div>
      </div>

      {/* Convert Button */}
      <div className="d-grid gap-2 mb-3">
        <button
          className="btn btn-primary"
          onClick={handleConvert}
          disabled={!inputUrl.trim()}
        >
          <i className="ti-exchange-vertical me-2"></i>
          Convert to Direct URL
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="ti-alert-circle me-2"></i>
          {error}
        </div>
      )}

      {/* Output Section */}
      {outputUrl && (
        <div className="mb-3">
          <label className="form-label fw-semibold text-success">
            <i className="ti-check me-2"></i>
            Direct Image URL (Use this in your Google Sheet)
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control bg-light"
              value={outputUrl}
              readOnly
            />
            <button
              className={`btn ${
                copied ? "btn-success" : "btn-outline-primary"
              }`}
              type="button"
              onClick={handleCopy}
            >
              <i className={`ti-${copied ? "check" : "copy"} me-1`}></i>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="form-text text-success">
            ✅ This URL is ready to use in your Google Sheet's "Images" column
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-light rounded">
        <h6 className="fw-semibold mb-2">
          <i className="ti-info-circle me-2"></i>
          How to get a Google Drive sharing URL:
        </h6>
        <ol className="small text-muted mb-0">
          <li>Upload your image to Google Drive</li>
          <li>Right-click on the image → "Share"</li>
          <li>Change to "Anyone with the link can view"</li>
          <li>Click "Copy link"</li>
          <li>Paste the link here and convert it</li>
        </ol>
      </div>
    </div>
  );
}
