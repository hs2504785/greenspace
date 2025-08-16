"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toastService from "@/utils/toastService";
import "bootstrap/dist/css/bootstrap.min.css";

async function createDiscussion(discussionData) {
  const res = await fetch("/api/discussions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discussionData),
  });
  if (!res.ok) throw new Error("Failed to create discussion");
  return res.json();
}

export default function NewDiscussionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "discussion",
  });

  const createMutation = useMutation({
    mutationFn: createDiscussion,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["discussions"]);
      toastService.success(
        `${
          formData.type === "recipe" ? "Recipe" : "Discussion"
        } created successfully!`,
        {
          icon: "✅",
        }
      );
      router.push(`/discussions/${data.id}`);
    },
    onError: (error) => {
      toastService.error(`Failed to create ${formData.type}: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!session) {
      toastService.warning("Please login to create a discussion");
      router.push("/login");
      return;
    }

    if (!session.user?.id) {
      toastService.error("User session invalid. Please login again.");
      router.push("/login");
      return;
    }

    createMutation.mutate({
      ...formData,
      user_id: session.user.id,
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!session) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <h4>Authentication Required</h4>
          <p>You need to be logged in to create a discussion.</p>
          <a href="/login" className="btn btn-primary">
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>
              Create New {formData.type === "recipe" ? "Recipe" : "Discussion"}
            </h1>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push("/discussions")}
            >
              ← Back to Discussions
            </button>
          </div>

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Type Selection */}
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="type"
                        id="discussion"
                        value="discussion"
                        checked={formData.type === "discussion"}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="discussion">
                        Discussion
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="type"
                        id="recipe"
                        value="recipe"
                        checked={formData.type === "recipe"}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="recipe">
                        Recipe
                      </label>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Title *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={
                      formData.type === "recipe"
                        ? "Recipe name..."
                        : "Discussion topic..."
                    }
                    required
                  />
                </div>

                {/* Content */}
                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    {formData.type === "recipe"
                      ? "Recipe & Instructions"
                      : "Content"}{" "}
                    *
                  </label>
                  <textarea
                    className="form-control"
                    id="content"
                    name="content"
                    rows="8"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder={
                      formData.type === "recipe"
                        ? "Share your recipe with ingredients and step-by-step instructions..."
                        : "Share your thoughts, ask questions, or start a conversation..."
                    }
                    required
                  />
                  <div className="form-text">
                    {formData.type === "recipe"
                      ? "Include ingredients list and cooking instructions"
                      : "Be clear and descriptive to encourage engagement"}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      createMutation.isLoading ||
                      !formData.title.trim() ||
                      !formData.content.trim()
                    }
                  >
                    {createMutation.isLoading
                      ? "Creating..."
                      : `Create ${
                          formData.type === "recipe" ? "Recipe" : "Discussion"
                        }`}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => router.push("/discussions")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
