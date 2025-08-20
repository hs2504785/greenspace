"use client";

import ImageOptimizationTest from "@/components/debug/ImageOptimizationTest";

export default function TestOptimizationPage() {
  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <h1 className="h3 mb-4">🎨 Image Optimization Testing</h1>
          <div className="alert alert-info mb-4">
            <h6>🎯 What This Tests:</h6>
            <ul className="mb-0">
              <li>
                <strong>Image Compression:</strong> Reduces file sizes by 70-90%
              </li>
              <li>
                <strong>Multiple Variants:</strong> Creates thumbnail, medium,
                and large sizes
              </li>
              <li>
                <strong>WebP Conversion:</strong> Modern format for better
                compression
              </li>
              <li>
                <strong>Storage Efficiency:</strong> Maximizes your 1GB Supabase
                limit
              </li>
            </ul>
          </div>
          <ImageOptimizationTest />
        </div>
      </div>
    </div>
  );
}
