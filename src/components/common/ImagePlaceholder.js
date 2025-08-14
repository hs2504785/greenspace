'use client';

const ImagePlaceholder = () => {
  return (
    <div 
      className="d-flex align-items-center justify-content-center bg-light w-100 h-100"
      style={{ minHeight: '200px' }}
    >
      <div className="text-center text-muted">
        <i className="ti-image fs-1 d-block mb-2"></i>
        <div>Image not available</div>
      </div>
    </div>
  );
};

export default ImagePlaceholder;