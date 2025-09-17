"use client";

import { useState } from "react";
import { convertGoogleDriveUrl } from "@/utils/googleDriveImageUtils";

export default function GoogleDriveFolderProcessor() {
  const [folderUrl, setFolderUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const handleAnalyzeFolder = () => {
    setError("");
    setInstructions("");
    setShowInstructions(false);

    if (!folderUrl.trim()) {
      setError("Please enter a Google Drive folder URL");
      return;
    }

    // Check if it's a Google Drive folder URL
    if (!folderUrl.includes("drive.google.com/drive/folders/")) {
      setError(
        "Please enter a valid Google Drive folder URL (should contain '/drive/folders/')"
      );
      return;
    }

    // Extract folder ID
    const folderMatch = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderMatch) {
      setError("Could not extract folder ID from URL");
      return;
    }

    const folderId = folderMatch[1];

    // Generate instructions for the user
    const instructionText = `
**Great! Your folder is ready. Here's how to get image URLs:**

**Method 1: Individual Image URLs (Recommended)**
1. Open your shared folder: ${folderUrl}
2. For each image you want to use:
   - Right-click on the image
   - Click "Get link" or "Copy link"
   - The image automatically inherits your folder's sharing permissions!
   - Convert the URL using our converter tool below

**Method 2: Bulk Processing (Advanced)**
Since your folder is shared publicly, you can:
1. Right-click on multiple images while holding Ctrl/Cmd
2. Select "Get link" for each
3. Use our bulk converter (coming soon) or convert each URL individually

**Your Folder ID:** ${folderId}
**Folder Status:** ✅ Ready for image sharing (assuming folder is publicly shared)

**Next Steps:**
1. Make sure your folder is shared publicly ("Anyone with the link can view")
2. Upload your product images to this folder
3. Get individual image links as needed
4. Convert URLs using the tool below
    `.trim();

    setInstructions(instructionText);
    setShowInstructions(true);
  };

  const handleClear = () => {
    setFolderUrl("");
    setInstructions("");
    setError("");
    setShowInstructions(false);
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="ti-folder me-2"></i>
          Google Drive Folder Helper
        </h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Google Drive Folder URL
          </label>
          <div className="input-group">
            <input
              type="url"
              className="form-control"
              placeholder="https://drive.google.com/drive/folders/1ABC123xyz"
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAnalyzeFolder()}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleClear}
              disabled={!folderUrl}
            >
              <i className="ti-close"></i>
            </button>
          </div>
          <div className="form-text">
            Paste your Google Drive folder URL here (the one you get when you
            share your "Product Images" folder)
          </div>
        </div>

        <div className="d-grid gap-2 mb-3">
          <button
            className="btn btn-info"
            onClick={handleAnalyzeFolder}
            disabled={!folderUrl.trim()}
          >
            <i className="ti-search me-2"></i>
            Analyze Folder & Get Instructions
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="ti-alert-circle me-2"></i>
            {error}
          </div>
        )}

        {showInstructions && (
          <div className="alert alert-success" role="alert">
            <h6 className="alert-heading">
              <i className="ti-check-box me-2"></i>
              Folder Analysis Complete!
            </h6>
            <div className="mt-3">
              <pre
                className="bg-light p-3 rounded small"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {instructions}
              </pre>
            </div>
          </div>
        )}

        <div className="border-top pt-3">
          <h6 className="fw-semibold mb-2">
            <i className="ti-info-circle me-2"></i>
            How to get your folder URL:
          </h6>
          <ol className="small text-muted mb-0">
            <li>Go to your "Product Images" folder in Google Drive</li>
            <li>Right-click on the folder → "Share"</li>
            <li>Change to "Anyone with the link can view"</li>
            <li>Click "Copy link"</li>
            <li>Paste the folder link here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Simplified folder sharing instructions component
export function FolderSharingInstructions() {
  return (
    <div className="card border-success">
      <div className="card-header bg-success text-white">
        <h6 className="mb-0">
          <i className="ti-lightbulb me-2"></i>
          🎉 Simplified Image Sharing
        </h6>
      </div>
      <div className="card-body">
        <h6 className="text-success mb-3">✅ Smart Approach</h6>
        <ul className="small text-success mb-3">
          <li>
            <strong>Share folder ONCE</strong> 🎯
          </li>
          <li>Upload all images</li>
          <li>Right-click → "Get link"</li>
          <li>Images inherit folder permissions!</li>
          <li>
            <strong>Done!</strong> 🚀
          </li>
        </ul>
        <div className="p-2 bg-light rounded">
          <small className="text-muted">
            <strong>Pro Tip:</strong> Once your folder is shared publicly, every
            image you add automatically becomes accessible. No more individual
            sharing!
          </small>
        </div>
      </div>
    </div>
  );
}
