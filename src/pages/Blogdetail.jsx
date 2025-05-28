// src/pages/Blogdetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Spinner, Alert, Breadcrumb } from 'react-bootstrap';

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`https://novacrest-backend.vercel.app/blogs/${id}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type':  'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        // API returns an array, so take the first element
        const item = Array.isArray(data) ? data[0] : data;
        setBlog(item || null);
      })
      .catch(() => setError('Error loading blog.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error)   return <Alert variant="danger" className="mt-4 text-center">{error}</Alert>;
  if (!blog)   return <p className="text-center mt-4 text-muted">Blog not found.</p>;

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/bloglist' }}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{blog.title}</Breadcrumb.Item>
      </Breadcrumb>

      {blog.thumbnail && (
        <img
          src={blog.thumbnail}
          alt={`${blog.title} thumbnail`}
          className="img-fluid rounded mb-4"
          width={300}
        />
      )}

      <h1 className="mb-3">{blog.title}</h1>

      <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.content }} />

      <Link to="/bloglist" className="btn btn-secondary mt-4">
        ← Back to Blogs
      </Link>
    </Container>
  );
}

