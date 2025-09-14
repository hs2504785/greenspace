"use client";

import { useEffect, useState, use } from "react";
import treeService from "@/services/TreeService";
import TreeDetailsClient from "@/components/features/TreeDetails";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useRouter } from "next/navigation";

export default function TreeDetailsPage({ params, searchParams }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const id = resolvedParams.id;

  useEffect(() => {
    const loadTree = async () => {
      try {
        setLoading(true);
        // Check if this is a position-based request (for varieties)
        const isPosition =
          resolvedSearchParams?.position === "true" ||
          (typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("position") ===
              "true");

        const data = await treeService.getTreeById(id, isPosition);
        setTree(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTree();
    }
  }, [id, resolvedSearchParams]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !tree) {
    return (
      <div className="container py-5 text-center">
        <h2>Tree Not Found</h2>
        <p className="text-muted">
          {error || "The tree you are looking for does not exist."}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/tree-management")}
        >
          Back to Tree Management
        </button>
      </div>
    );
  }

  return <TreeDetailsClient tree={tree} />;
}
