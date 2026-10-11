import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";

export default function Blogs() {
  const { getBlogs, deleteBlog } = useContext(AppContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage]);

  const fetchBlogs = async (page) => {
    setLoading(true);
    const response = await getBlogs(page, 10);
    if (response.blogs) {
      setBlogs(response.blogs);
      setPagination(response.pagination);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    
    setDeleteLoading(id);
    const response = await deleteBlog(id);
    
    if (response.message === "Blog deleted") {
      fetchBlogs(currentPage);
    } else {
      alert("Failed to delete blog");
    }
    setDeleteLoading(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const { currentPage, totalPages } = pagination;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-4 py-2 mx-1 rounded ${
              i === currentPage
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
            }`}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(
          <span key={i} className="px-2 text-gray-500">
            ...
          </span>
        );
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-blue-600 text-xl">Loading blogs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">Blogs</h1>
          <button
            onClick={() => navigate("/add-blog")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Add New Blog
          </button>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl">No blogs found</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6">
              {blogs.map((blog) => (
                <div
                  key={blog._id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-6"
                >
                  <div className="flex gap-6">
                    {blog.img && (
                      <img
                        src={blog.img}
                        alt={blog.title}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                              {blog.tag}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {blog.date}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {blog.read} read
                            </span>
                            <span className="text-gray-500 text-sm">
                              {blog.views} views
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {blog.title}
                          </h2>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {blog.desc}
                          </p>
                          <p className="text-gray-500 text-sm">
                            By {blog.author}
                          </p>
                          {blog.slug && (
                            <a
                              href={`https://bim.africa/blog/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline break-all"
                            >
                              bim.africa/blog/{blog.slug}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => navigate(`/add-blog?id=${blog._id}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            disabled={deleteLoading === blog._id}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {deleteLoading === blog._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 mx-1 bg-white text-blue-600 border border-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50"
                >
                  Previous
                </button>
                {renderPagination()}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 mx-1 bg-white text-blue-600 border border-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50"
                >
                  Next
                </button>
              </div>
            )}

            <div className="text-center mt-4 text-gray-600">
              Showing page {pagination.currentPage} of {pagination.totalPages} (
              {pagination.totalBlogs} total blogs)
            </div>
          </>
        )}
      </div>
    </div>
  );
}