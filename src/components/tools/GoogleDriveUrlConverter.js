"use client";

import { useState } from "react";
import {
  convertGoogleDriveUrl,
  extractGoogleDriveFileId,
} from "@/utils/googleDriveImageUtils";

export default function GoogleDriveUrlConverter() {
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
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="ti-link me-2"></i>
          Google Drive URL Converter
        </h5>
      </div>
      <div className="card-body">
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

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="ti-alert-circle me-2"></i>
            {error}
          </div>
        )}

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

        <div className="border-top pt-3">
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
    </div>
  );
}

// Example usage component for demonstration
export function GoogleDriveUrlConverterExample() {
  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <GoogleDriveUrlConverter />

        <div className="mt-4">
          <div className="card border-info">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">
                <i className="ti-lightbulb me-2"></i>
                Example Conversion
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <strong>Input (Sharing URL):</strong>
                <code className="d-block small text-muted mt-1">
                  https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing
                </code>
              </div>
              <div className="text-center my-2">
                <i className="ti-arrow-down text-primary"></i>
              </div>
              <div>
                <strong>Output (Direct URL):</strong>
                <code className="d-block small text-success mt-1">
                  https://drive.google.com/uc?export=view&id=1ABC123xyz456
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


