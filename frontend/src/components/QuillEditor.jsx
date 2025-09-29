// src/components/QuillEditor.jsx
import React, { useMemo, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { compressAndEncodeImage, blogAPI } from '../services/api';

const QuillEditor = ({ value, onChange, placeholder = 'Start writing your blog content...' }) => {
  const quillRef = useRef(null);

  const handleImageInsert = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return;

        // Compress locally, then upload to backend to get Cloudinary URL
        const dataUrl = await compressAndEncodeImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
        const { data } = await blogAPI.uploadInlineImage(dataUrl);
        const url = data?.url || data?.data?.url || '';
        if (url) {
          const editor = quillRef.current?.getEditor?.();
          if (editor) {
            const range = editor.getSelection(true);
            editor.insertEmbed(range ? range.index : 0, 'image', url, 'user');
          }
        }
      };
      input.click();
    } catch (err) {
      // Silently fail; upstream UI can show toasts if desired
      console.error('Quill image insert error:', err);
    }
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ size: [] }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageInsert,
      }
    }
  }), [handleImageInsert]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet',
    'script', 'indent', 'direction',
    'size', 'color', 'background', 'align',
    'link', 'image'
  ];

  return (
    <div className="quill-wrapper">
      <ReactQuill
        theme="snow"
        ref={quillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg"
      />
      <style>{`
        .quill-wrapper .ql-toolbar {
          border-color: rgb(209 213 219); /* gray-300 */
        }
        .quill-wrapper .ql-container {
          border-color: rgb(209 213 219); /* gray-300 */
          min-height: 24rem; /* similar to min-h-96 */
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .dark .quill-wrapper .ql-toolbar,
        .dark .quill-wrapper .ql-container {
          border-color: rgb(75 85 99); /* gray-600 */
        }
        .dark .quill-wrapper .ql-container .ql-editor {
          color: #f9fafb; /* gray-50 */
        }
      `}</style>
    </div>
  );
};

export default QuillEditor;
