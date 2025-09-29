// src/components/RichTextEditor.jsx
import React, { useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Undo,
  Redo
} from 'lucide-react';

const RichTextEditor = ({ content, onChange, placeholder = "Start writing..." }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContent();
  };

  const ToolbarButton = ({ onClick, icon: Icon, title, isActive = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md border transition-colors ${
        isActive
          ? 'bg-blue-100 border-blue-300 text-blue-600 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-400'
          : 'border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => execCommand('undo')}
            icon={Undo}
            title="Undo"
          />
          <ToolbarButton
            onClick={() => execCommand('redo')}
            icon={Redo}
            title="Redo"
          />
        </div>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => execCommand('bold')}
            icon={Bold}
            title="Bold"
          />
          <ToolbarButton
            onClick={() => execCommand('italic')}
            icon={Italic}
            title="Italic"
          />
          <ToolbarButton
            onClick={() => execCommand('underline')}
            icon={Underline}
            title="Underline"
          />
        </div>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <div className="flex gap-1">
          <select
            onChange={(e) => execCommand('formatBlock', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            defaultValue=""
          >
            <option value="">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
          </select>
        </div>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => execCommand('insertUnorderedList')}
            icon={List}
            title="Bullet List"
          />
          <ToolbarButton
            onClick={() => execCommand('insertOrderedList')}
            icon={ListOrdered}
            title="Numbered List"
          />
          <ToolbarButton
            onClick={() => execCommand('formatBlock', 'blockquote')}
            icon={Quote}
            title="Quote"
          />
        </div>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <div className="flex gap-1">
          <ToolbarButton
            onClick={insertLink}
            icon={Link}
            title="Insert Link"
          />
          <ToolbarButton
            onClick={insertImage}
            icon={Image}
            title="Insert Image"
          />
          <ToolbarButton
            onClick={() => execCommand('formatBlock', 'pre')}
            icon={Code}
            title="Code Block"
          />
        </div>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

        <div className="flex gap-1">
          <select
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            defaultValue="3"
          >
            <option value="1">Very Small</option>
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="4">Large</option>
            <option value="5">Very Large</option>
            <option value="6">Huge</option>
            <option value="7">Maximum</option>
          </select>
          
          <input
            type="color"
            onChange={(e) => execCommand('foreColor', e.target.value)}
            className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            title="Text Color"
          />
          
          <input
            type="color"
            onChange={(e) => execCommand('backColor', e.target.value)}
            className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            title="Background Color"
          />
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onPaste={handlePaste}
        className="min-h-96 p-4 text-gray-900 dark:text-gray-100 focus:outline-none"
        style={{ minHeight: '24rem' }}
        data-placeholder={placeholder}
      />
      
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
        [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.875rem 0;
        }
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0;
        }
        [contenteditable] h4 {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0.625rem 0;
        }
        [contenteditable] h5 {
          font-size: 1rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        [contenteditable] h6 {
          font-size: 0.875rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #3B82F6;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6B7280;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 2rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] pre {
          background: #F3F4F6;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1rem 0;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }
        [contenteditable] a {
          color: #3B82F6;
          text-decoration: underline;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;