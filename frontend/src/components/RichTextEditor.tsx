import React, { useRef, useEffect } from 'react';
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}
const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, disabled }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);
  const handleInput = React.useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      el.addEventListener('input', handleInput);
      el.addEventListener('blur', handleInput);
      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('blur', handleInput);
      };
    }
  }, [handleInput]);
  const execCmd = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  };
  return (
    <div className={`editor-container ${disabled ? 'disabled' : ''}`}>
      <div className="editor-toolbar">
        <button type="button" className="editor-toolbar-btn" onClick={() => execCmd('bold')} disabled={disabled} title="Bold">
          <b>B</b>
        </button>
        <button type="button" className="editor-toolbar-btn" onClick={() => execCmd('italic')} disabled={disabled} title="Italic">
          <i>I</i>
        </button>
        <button type="button" className="editor-toolbar-btn" onClick={() => execCmd('underline')} disabled={disabled} title="Underline">
          <u>U</u>
        </button>
        <button type="button" className="editor-toolbar-btn" onClick={() => execCmd('insertUnorderedList')} disabled={disabled} title="Bullet List">
          • List
        </button>
        <button type="button" className="editor-toolbar-btn" onClick={() => execCmd('insertOrderedList')} disabled={disabled} title="Numbered List">
          1. List
        </button>
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={!disabled}
        data-placeholder={placeholder}
      />
    </div>
  );
};
export default RichTextEditor;