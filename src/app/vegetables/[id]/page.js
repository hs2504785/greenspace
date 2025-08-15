"use client";

import { useEffect, useState, use } from "react";
import vegetableService from "@/services/VegetableService";
import VegetableDetailsClient from "@/components/features/VegetableDetails";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useRouter } from "next/navigation";

export default function VegetableDetailsPage({ params }) {
  const [vegetable, setVegetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  useEffect(() => {
    const loadVegetable = async () => {
      try {
        setLoading(true);
        const data = await vegetableService.getVegetableById(id);
        setVegetable(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVegetable();
    }
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !vegetable) {
    return (
      <div className="container py-5 text-center">
        <h2>Vegetable Not Found</h2>
        <p className="text-muted">
          {error || "The vegetable you are looking for does not exist."}
        </p>
        <button className="btn btn-primary" onClick={() => router.push("/")}>
          Back to Listings
        </button>
      </div>
    );
  }

  return <VegetableDetailsClient vegetable={vegetable} />;
}
