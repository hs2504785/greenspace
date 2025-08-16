"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toastService from "@/utils/toastService";
import "bootstrap/dist/css/bootstrap.min.css";

async function fetchDiscussion(id) {
  const res = await fetch(`/api/discussions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch discussion");
  return res.json();
}

async function fetchMessages(discussionId) {
  const res = await fetch(`/api/discussions/${discussionId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

async function postMessage(discussionId, content) {
  const res = await fetch(`/api/discussions/${discussionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to post message");
  return res.json();
}

export default function DiscussionDetailPage({ params }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [replyContent, setReplyContent] = useState("");
  const discussionId = params.id;

  const {
    data: discussion,
    isLoading: discussionLoading,
    error: discussionError,
  } = useQuery({
    queryKey: ["discussion", discussionId],
    queryFn: () => fetchDiscussion(discussionId),
  });

  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", discussionId],
    queryFn: () => fetchMessages(discussionId),
  });

  const postMessageMutation = useMutation({
    mutationFn: (content) => postMessage(discussionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", discussionId]);
      setReplyContent("");
      toastService.success("Reply posted successfully!", {
        icon: "💬",
      });
    },
    onError: (error) => {
      toastService.error(`Failed to post reply: ${error.message}`);
    },
  });

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !session) return;
    postMessageMutation.mutate(replyContent);
  };

  if (discussionLoading)
    return (
      <div className="container py-4">
        <div className="alert alert-info">Loading discussion...</div>
      </div>
    );
  if (discussionError)
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{discussionError.message}</div>
      </div>
    );

  return (
    <div className="container py-4">
      {/* Discussion Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-secondary"
          onClick={() => router.push("/discussions")}
        >
          ← Back to Discussions
        </button>
        <span className="badge bg-primary">{discussion?.type}</span>
      </div>

      {/* Discussion Content */}
      <div className="card mb-4">
        <div className="card-header">
          <h1 className="card-title mb-0">{discussion?.title}</h1>
          <small className="text-muted">
            Posted{" "}
            {discussion?.created_at
              ? new Date(discussion.created_at).toLocaleDateString()
              : ""}
          </small>
        </div>
        <div className="card-body">
          <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
            {discussion?.content}
          </p>
        </div>
      </div>

      {/* Messages Section */}
      <div className="card">
        <div className="card-header">
          <h3>Replies</h3>
        </div>
        <div className="card-body">
          {messagesLoading && (
            <div className="alert alert-info">Loading replies...</div>
          )}
          {messagesError && (
            <div className="alert alert-danger">{messagesError.message}</div>
          )}

          {messages && messages.data && messages.data.length === 0 && (
            <div className="alert alert-warning">
              No replies yet. Be the first to reply!
            </div>
          )}

          {messages &&
            messages.data &&
            messages.data.map((message) => (
              <div key={message.id} className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>User</strong> {/* TODO: Show actual user name */}
                    <small className="text-muted ms-2">
                      {new Date(message.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <p className="mt-2 mb-0" style={{ whiteSpace: "pre-wrap" }}>
                  {message.content}
                </p>
              </div>
            ))}

          {/* Reply Form */}
          {session ? (
            <form onSubmit={handleReplySubmit} className="mt-4">
              <div className="mb-3">
                <label htmlFor="reply" className="form-label">
                  Post a Reply
                </label>
                <textarea
                  id="reply"
                  className="form-control"
                  rows="4"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={postMessageMutation.isLoading || !replyContent.trim()}
              >
                {postMessageMutation.isLoading ? "Posting..." : "Post Reply"}
              </button>
            </form>
          ) : (
            <div className="alert alert-info mt-4">
              <a href="/login">Login</a> to post a reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
