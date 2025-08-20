import React, { useState } from "react";
import { imageOptimizationService } from "../../services/ImageOptimizationService";
import vegetableService from "../../services/VegetableService";

const ImageOptimizationTest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResults(null);
    }
  };

  const testOptimization = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log("🧪 Testing image optimization...");

      // Test optimization only (no upload)
      const variants = await imageOptimizationService.createImageVariants(
        selectedFile
      );

      setResults({
        original: {
          name: selectedFile.name,
          size: selectedFile.size,
          sizeKB: (selectedFile.size / 1024).toFixed(1),
          type: selectedFile.type,
        },
        variants: variants,
      });

      console.log("✅ Optimization test completed");
    } catch (err) {
      console.error("❌ Optimization test failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const testFullUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log("🚀 Testing full upload with optimization...");

      const uploadResult = await vegetableService.uploadImage(selectedFile);

      setResults({
        original: {
          name: selectedFile.name,
          size: selectedFile.size,
          sizeKB: (selectedFile.size / 1024).toFixed(1),
          type: selectedFile.type,
        },
        uploadResult: uploadResult,
      });

      console.log("✅ Full upload test completed");
    } catch (err) {
      console.error("❌ Upload test failed:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">🎨 Image Optimization Test</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="testImage" className="form-label">
              Select Test Image
            </label>
            <input
              type="file"
              className="form-control"
              id="testImage"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>

          {selectedFile && (
            <div className="mb-3">
              <strong>Original File:</strong> {selectedFile.name}
              <br />
              <span className="text-muted">
                {(selectedFile.size / 1024).toFixed(1)} KB ({selectedFile.type})
              </span>
            </div>
          )}

          <div className="mb-3">
            <button
              type="button"
              className="btn btn-primary me-2"
              onClick={testOptimization}
              disabled={!selectedFile || processing}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Processing...
                </>
              ) : (
                "Test Optimization Only"
              )}
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={testFullUpload}
              disabled={!selectedFile || processing}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Uploading...
                </>
              ) : (
                "Test Full Upload"
              )}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
            </div>
          )}

          {results && (
            <div className="alert alert-success">
              <h6>🎉 Test Results:</h6>

              <div className="mt-3">
                <strong>Original Image:</strong>
                <ul className="list-unstyled ms-3">
                  <li>📄 Name: {results.original.name}</li>
                  <li>📏 Size: {results.original.sizeKB} KB</li>
                  <li>🏷️ Type: {results.original.type}</li>
                </ul>
              </div>

              {results.variants && (
                <div className="mt-3">
                  <strong>Optimized Variants:</strong>
                  <div className="row mt-2">
                    {Object.entries(results.variants).map(([name, data]) => (
                      <div key={name} className="col-md-4 mb-2">
                        <div className="card">
                          <div className="card-body p-2">
                            <h6 className="card-title text-capitalize">
                              {name}
                            </h6>
                            <p className="card-text small">
                              Size: <strong>{data.sizeKB} KB</strong>
                              <br />
                              Reduction:{" "}
                              <strong>
                                {(
                                  ((results.original.size - data.size) /
                                    results.original.size) *
                                  100
                                ).toFixed(1)}
                                %
                              </strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <strong>Total Size:</strong>{" "}
                    {Object.values(results.variants)
                      .reduce((sum, v) => sum + parseFloat(v.sizeKB), 0)
                      .toFixed(1)}{" "}
                    KB
                  </div>
                </div>
              )}

              {results.uploadResult && (
                <div className="mt-3">
                  <strong>Upload Result:</strong>
                  <div className="mt-2">
                    <p>
                      <strong>Primary URL:</strong>
                    </p>
                    <p className="text-break small">
                      {results.uploadResult.url}
                    </p>

                    {results.uploadResult.variants && (
                      <details className="mt-2">
                        <summary>View All Variant URLs</summary>
                        <pre className="mt-2 small">
                          {JSON.stringify(
                            results.uploadResult.variants,
                            null,
                            2
                          )}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <h6>📊 Expected Benefits:</h6>
            <ul className="list-unstyled">
              <li>
                ✅ <strong>File Size Reduction:</strong> 70-90% smaller files
              </li>
              <li>
                ✅ <strong>Multiple Variants:</strong> Thumbnail (5KB), Medium
                (30KB), Large (100KB)
              </li>
              <li>
                ✅ <strong>WebP Format:</strong> Better compression than
                JPEG/PNG
              </li>
              <li>
                ✅ <strong>Storage Optimization:</strong> Fit 10x more images in
                1GB
              </li>
              <li>
                ✅ <strong>Faster Loading:</strong> Smaller files = faster page
                loads
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOptimizationTest;
