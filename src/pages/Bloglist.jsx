// src/pages/Bloglist.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';

export default function BlogList() {
  const [blogs, setBlogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch('https://novacrest-backend.vercel.app/blogs', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => setBlogs(data))
      .catch(() => setError('Failed to load blogs.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error)   return <Alert variant="danger" className="mt-4 text-center">{error}</Alert>;
  if (!blogs.length) return <p className="text-center mt-4">No blogs yet.</p>;

  return (
    <Container className="py-4">
      <h2 className="mb-4">Pharmacy Blog</h2>
      <Row className="g-4">
        {blogs.map(blog => (
          <Col key={blog.id} xs={12} md={6} lg={4}>
            <Card className="h-100 shadow-sm hover-lift">
              {blog.thumbnail && <Card.Img variant="top" src={blog.thumbnail} />}
              <Card.Body className="d-flex flex-column">
                <Card.Title>{blog.title}</Card.Title>
                <Card.Text className="flex-grow-1 text-truncate">
                  {blog.content.replace(/<\/?[^>]+(>|$)/g, '')}
                </Card.Text>
                <Link to={`/blogdetail/${blog.id}`} className="btn btn-primary mt-auto">
                  Read more
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
