"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import 'bootstrap/dist/css/bootstrap.min.css';

async function fetchDiscussions() {
  const res = await fetch('/api/discussions');
  if (!res.ok) throw new Error('Failed to fetch discussions');
  return res.json();
}

export default function DiscussionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['discussions'],
    queryFn: fetchDiscussions
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Discussions & Recipes Forum</h1>
        <a href="/discussions/new" className="btn btn-primary">
          + New Discussion
        </a>
      </div>
      {isLoading && <div className="alert alert-info">Loading discussions...</div>}
      {error && <div className="alert alert-danger">{error.message}</div>}
      {data && data.data && data.data.length === 0 && (
        <div className="alert alert-warning">No discussions found.</div>
      )}
      {data && data.data && data.data.length > 0 && (
        <div className="list-group mt-3">
          {data.data.map((d) => (
            <div key={d.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    <a href={`/discussions/${d.id}`} className="text-decoration-none">
                      {d.title}
                    </a>
                  </h5>
                  <small className="text-muted">{d.type}</small>
                </div>
              </div>
              <p className="mb-1 text-truncate">{d.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
