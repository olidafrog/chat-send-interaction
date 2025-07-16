import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Paperclip, Smile } from 'lucide-react';

const ChatSendPrototype = () => {
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState([]);
  const [isMultilineMode, setIsMultilineMode] = useState(false);
  const textareaRef = useRef(null);

  // Check if we should be in multiline mode
  useEffect(() => {
    const checkMultilineMode = () => {
      // Check for conditions that trigger multiline mode
      const hasShiftReturn = message.includes('\n');
      const hasUnorderedList = /^[\s]*[-*+]\s/m.test(message);
      const hasOrderedList = /^[\s]*\d+\.\s/m.test(message);
      const hasHeading = /^#{1,6}\s/m.test(message);
      const hasCodeBlock = message.includes('```');
      
      setIsMultilineMode(
        hasShiftReturn || hasUnorderedList || hasOrderedList || hasHeading || hasCodeBlock
      );
    };

    checkMultilineMode();
  }, [message]);

  // Format the input text for display
  const formatInputText = (text) => {
    // Split by lines to handle each line separately
    const lines = text.split('\n');
    const formattedLines = lines.map(line => {
      // Handle unordered lists
      if (/^[\s]*[-*+]\s/.test(line)) {
        return line.replace(/^([\s]*)([-*+])\s/, '$1• ');
      }
      // Handle ordered lists - keep the same format
      return line;
    });
    return formattedLines.join('\n');
  };

  // Simple markdown to HTML converter for display
  const renderMarkdown = (text) => {
    let html = text;
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded my-2"><code>$1</code></pre>');
    
    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold my-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold my-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold my-2">$1</h1>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^\+ (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.*)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/g, '<em>$1</em>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  const handleKeyDown = (e) => {
    // Handle Enter with modifiers first (highest priority)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
      return;
    }
    
    // Handle Shift+Enter
    if (e.key === 'Enter' && e.shiftKey) {
      // Default behavior - just add newline
      return;
    }
    
    // Handle plain Enter
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = message.substring(0, cursorPos);
      const textAfterCursor = message.substring(cursorPos);
      
      // Check if we're at the end of a list item
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Check for unordered list
      const unorderedMatch = currentLine.match(/^(\s*)([-*+])\s(.*)$/);
      if (unorderedMatch) {
        e.preventDefault();
        const [, spaces, bullet, content] = unorderedMatch;
        if (content.trim() === '') {
          // Empty list item - remove the bullet and exit list
          const newText = message.substring(0, cursorPos - currentLine.length) + textAfterCursor;
          setMessage(newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos - currentLine.length;
            // Update textarea height
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          }, 0);
        } else {
          // Add new list item
          const newText = textBeforeCursor + '\n' + spaces + bullet + ' ' + textAfterCursor;
          setMessage(newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos + spaces.length + 3;
            // Update textarea height
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          }, 0);
        }
        return;
      }
      
      // Check for ordered list
      const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
      if (orderedMatch) {
        e.preventDefault();
        const [, spaces, number, content] = orderedMatch;
        if (content.trim() === '') {
          // Empty list item - remove the number and exit list
          const newText = message.substring(0, cursorPos - currentLine.length) + textAfterCursor;
          setMessage(newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos - currentLine.length;
            // Update textarea height
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          }, 0);
        } else {
          // Add new list item with incremented number
          const nextNumber = parseInt(number) + 1;
          const newText = textBeforeCursor + '\n' + spaces + nextNumber + '. ' + textAfterCursor;
          setMessage(newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos + spaces.length + nextNumber.toString().length + 3;
            // Update textarea height
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          }, 0);
        }
        return;
      }
      
      // Default behavior for Enter
      if (isMultilineMode) {
        // In multiline mode, Enter creates new line
        return;
      } else {
        // In single-line mode, Enter sends
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      setSentMessages([...sentMessages, message]);
      setMessage('');
      setIsMultilineMode(false);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const insertFormatting = (type) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = message;
    const selectedText = text.substring(start, end);
    
    let newText = '';
    let newCursorPos = start;
    
    switch (type) {
      case 'bold':
        newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end);
        newCursorPos = start + 2;
        break;
      case 'italic':
        newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end);
        newCursorPos = start + 1;
        break;
      case 'strikethrough':
        newText = text.substring(0, start) + `~~${selectedText || 'strikethrough text'}~~` + text.substring(end);
        newCursorPos = start + 2;
        break;
      case 'unordered-list':
        newText = text.substring(0, start) + '\n- ' + text.substring(end);
        newCursorPos = start + 3;
        break;
      case 'ordered-list':
        newText = text.substring(0, start) + '\n1. ' + text.substring(end);
        newCursorPos = start + 4;
        break;
      case 'quote':
        newText = text.substring(0, start) + '\n> ' + text.substring(end);
        newCursorPos = start + 3;
        break;
      case 'code':
        newText = text.substring(0, start) + '```\n' + (selectedText || 'code') + '\n```' + text.substring(end);
        newCursorPos = start + 4;
        break;
    }
    
    setMessage(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }, 0);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Rendered Messages */}
      <div className="mb-4 space-y-2">
        {sentMessages.map((msg, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg) }}
            />
          </div>
        ))}
      </div>

      {/* Message Input Area */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-200">
          <button
            onClick={() => insertFormatting('bold')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => insertFormatting('italic')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => insertFormatting('strikethrough')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => insertFormatting('unordered-list')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => insertFormatting('ordered-list')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            onClick={() => insertFormatting('quote')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Quote"
          >
            <Quote size={18} />
          </button>
          <button
            onClick={() => insertFormatting('code')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Code"
          >
            <Code size={18} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Attach File"
          >
            <Paperclip size={18} />
          </button>
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-2 p-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={formatInputText(message)}
              onChange={(e) => {
                const newValue = e.target.value;
                // Reverse the bullet point formatting when storing
                const cleanValue = newValue.replace(/• /g, '- ');
                setMessage(cleanValue);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full resize-none border-0 outline-none min-h-[24px] max-h-[200px] leading-6"
              style={{ height: 'auto', overflowY: 'auto' }}
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Smile size={20} />
            </button>
            
            <div className="relative group">
              <button
                onClick={handleSend}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1"
              >
                <Send size={18} />
                {isMultilineMode && (
                  <span className="text-xs">⌘</span>
                )}
              </button>
              
              {/* Tooltip */}
              {isMultilineMode && (
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap">
                    <div className="font-semibold mb-1">If the user has:</div>
                    <ul className="space-y-0.5">
                      <li>• Used shift+return</li>
                      <li>• Started a ordered/unordered list</li>
                      <li>• Used a heading</li>
                      <li>• Is typing inside a code block</li>
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      Enter = carriage return, ⌘+Enter = Send
                    </div>
                    <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 pb-2 text-xs text-gray-500">
          <span>
            {isMultilineMode ? (
              <span className="flex items-center gap-1">
                <CornerDownLeft size={12} />
                Enter for new line • ⌘+Enter to send
              </span>
            ) : (
              'Enter to send'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatSendPrototype;