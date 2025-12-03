import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppContext from "../context/AppContext";
import MDEditor from "@uiw/react-md-editor";


export default function AddBlog() {
  const { addBlog, updateBlog, getBlogById } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const blogId = searchParams.get("id");
  const isUpdateMode = !!blogId;

  const [loading, setLoading] = useState(false);
  const [fetchingBlog, setFetchingBlog] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    img: "",
    tag: "",
    date: "",
    read: "",
    views: "",
    title: "",
    desc: "",
    extraDesc: "",
    author: "",
    keywords: "", 
    isFeature: false
  });

  useEffect(() => {
    if (isUpdateMode) {
      fetchBlogData();
    }
  }, [blogId]);

  const fetchBlogData = async () => {
    setFetchingBlog(true);
    const response = await getBlogById(blogId);
    if (response && !response.error) {
      setFormData({
        img: response.img || "",
        tag: response.tag || "",
        date: response.date || "",
        read: response.read || "",
        views: response.views || "",
        title: response.title || "",
        desc: response.desc || "",
        extraDesc: response.extraDesc || "",
        author: response.author || "",
        isFeature: response.isFeature || false
      });
    } else {
      alert("Failed to fetch blog data");
      navigate("/blogs");
    }
    setFetchingBlog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Upload to Cloudinary unsigned endpoint. Replace placeholders below.
  const uploadImageToCloudinary = async (file) => {
    if (!file) throw new Error("No file provided");

    // ---------- CONFIGURE THESE ----------
    const CLOUD_NAME = "dy1lbmx8i"; // e.g. "mycloudname"
    const UPLOAD_PRESET = "BIM Africe"; // unsigned preset you created in Cloudinary
    // -------------------------------------

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    // optional: you can append folder, public_id, etc: fd.append("folder", "blogs");

    setImgUploading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data?.error?.message || JSON.stringify(data);
        throw new Error(`Upload failed: ${message}`);
      }

      // Cloudinary returns secure_url (https). Use that.
      return data.secure_url || data.url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw err;
    } finally {
      setImgUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // optional: basic client-side validation (size/type)
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Please upload an image smaller than ${maxMB} MB`);
      e.target.value = "";
      return;
    }

    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      setFormData((prev) => ({ ...prev, img: uploadedUrl }));
      // optionally clear the file input after upload
      // e.target.value = "";
    } catch (err) {
      alert("Image upload failed. Check console for details.");
      // keep file input so user can retry
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ensure image exists (either previously set or just uploaded)
    if (!formData.img) {
      alert("Please upload an image before submitting.");
      return;
    }

    setLoading(true);

    let response;
    if (isUpdateMode) {
      response = await updateBlog(blogId, formData);
    } else {
      response = await addBlog(formData);
    }

    if (response && !response.error) {
      alert(isUpdateMode ? "Blog updated successfully!" : "Blog created successfully!");
      navigate("/blogs");
    } else {
      alert(`Failed to ${isUpdateMode ? "update" : "create"} blog: ${response?.error || response?.message || "Unknown error"}`);
    }
    setLoading(false);
  };

  if (fetchingBlog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-blue-600 text-xl">Loading blog data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate("/blogs")}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Blogs
          </button>
          <h1 className="text-4xl font-bold text-blue-600">
            {isUpdateMode ? "Update Blog" : "Add New Blog"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image uploader */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Image *</label>

            <div className="flex items-center gap-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Upload an image — it will be stored on Cloudinary and the URL saved automatically.
                </div>
              </div>

              {/* preview */}
              <div className="w-32 h-20 rounded overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                {imgUploading ? (
                  <div className="text-sm text-gray-500">Uploading...</div>
                ) : formData.img ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={formData.img} alt="preview" className="object-cover w-full h-full" />
                ) : (
                  <div className="text-xs text-gray-400 px-2 text-center">No image</div>
                )}
              </div>
            </div>

            {/* readonly URL field so you can see the saved url (optional) */}
            <input
              type="text"
              name="img"
              value={formData.img}
              onChange={handleChange}
              readOnly
              placeholder="Image URL will appear here after upload"
              className="mt-3 w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Tag *</label>
              <input
                type="text"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Technology"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Date *</label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Jan 1, 2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Read Time *</label>
              <input
                type="text"
                name="read"
                value={formData.read}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="5 min"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Views *</label>
              <input
                type="text"
                name="views"
                value={formData.views}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="1.2k"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter blog title"
            />
          </div>
<div>
  <label className="block text-gray-700 font-medium mb-2">Description *</label>

  <div
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
  >
    <MDEditor
      value={formData.desc}                     // ✔ your value
      onChange={(val) =>
        handleChange({ target: { name: "desc", value: val || "" } })
      }                                         // ✔ your onchange pattern
      placeholder="Enter blog description"      // ✔ your placeholder
      required                                  // ✔ your required
      rows={4}                                  // ✔ your rows
      className="w-full"                        // ✔ inside same styling
    />
  </div>
</div>

<div>
  <label className="block text-gray-700 font-medium mb-2">Extra Description *</label>

  <div
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
  >
    <MDEditor
      value={formData.extraDesc}                // ✔ same value
      onChange={(val) =>
        handleChange({ target: { name: "extraDesc", value: val || "" } })
      }                                         // ✔ same onchange
      placeholder="Enter additional details"    // ✔ same placeholder
      required                                  // ✔ same required
      rows={6}                                  // ✔ same rowsgit remote remove origin

      className="w-full"
    />
  </div>
</div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Author *</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="John Doe"
            />
          </div>
          <div className="mt-4">
  <label className="block text-gray-700 font-medium mb-2">SEO Keywords *</label>

  <input
    type="text"
    name="keywords"
    placeholder="Enter keywords (comma separated)"
    value={formData.keywords}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
    required
  />

  <p className="text-xs text-gray-500 mt-1">
    Example: cybersecurity, AI, cloud security, digital transformation
  </p>
</div>

          {/* input for asking to add blog to featured only true false */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Featured *</label>
            <div className="flex items-center">
              <input
                type="radio"
                name="isFeature"
                value="true"
                checked={formData.isFeature === true}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isFeature: e.target.value === "true" }))
                }
                className="mr-2"
              />
              Yes
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                name="isFeature"
                value="false"
                checked={formData.isFeature === false}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isFeature: e.target.value === "true" }))
                }
                className="mr-2"
              />
              No
            </div>
          </div>


          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || imgUploading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? (isUpdateMode ? "Updating..." : "Creating...") : isUpdateMode ? "Update Blog" : "Create Blog"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/blogs")}
              className="px-8 bg-white text-blue-600 border border-blue-600 py-3 rounded-lg hover:bg-blue-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
