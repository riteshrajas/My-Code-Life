import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  Highlighter, 
  Type,
  Palette,
  Undo,
  Redo 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiaryTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface FormatAction {
  type: 'bold' | 'underline' | 'highlight' | 'color';
  color?: string;
}

const DiaryTextEditor: React.FC<DiaryTextEditorProps> = ({
  value,
  onChange,
  placeholder = "What's on your mind today?",
  className
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Predefined highlight colors
  const highlightColors = [
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-200 text-yellow-900' },
    { name: 'Green', value: 'green', class: 'bg-green-200 text-green-900' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-200 text-blue-900' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-200 text-pink-900' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-200 text-purple-900' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-200 text-orange-900' }
  ];

  const addToHistory = (newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { text: '', start: 0, end: 0 };
    
    return {
      text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd),
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    };
  };

  const insertFormatting = (action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { text, start, end } = getSelectedText();
    
    if (text.length === 0) {
      // No text selected, show placeholder formatting
      let placeholder = '';
      switch (action.type) {
        case 'bold':
          placeholder = '*bold text*';
          break;
        case 'underline':
          placeholder = '`underlined text`';
          break;
        case 'highlight':
          placeholder = `|${action.color || 'yellow'}|highlighted text|${action.color || 'yellow'}|`;
          break;
      }
      
      const newValue = value.substring(0, start) + placeholder + value.substring(end);
      onChange(newValue);
      addToHistory(newValue);
      
      // Select the placeholder text for easy editing
      setTimeout(() => {
        const startPos = action.type === 'highlight' 
          ? start + `|${action.color || 'yellow'}|`.length
          : start + (action.type === 'bold' ? 1 : 1);
        
        const endPos = action.type === 'highlight'
          ? startPos + 'highlighted text'.length
          : startPos + (action.type === 'bold' ? 'bold text'.length : 'underlined text'.length);
          
        textarea.setSelectionRange(startPos, endPos);
        textarea.focus();
      }, 0);
    } else {
      // Text is selected, wrap it with formatting
      let formattedText = '';
      switch (action.type) {
        case 'bold':
          formattedText = `*${text}*`;
          break;
        case 'underline':
          formattedText = `\`${text}\``;
          break;
        case 'highlight':
          formattedText = `|${action.color || 'yellow'}|${text}|${action.color || 'yellow'}|`;
          break;
      }
      
      const newValue = value.substring(0, start) + formattedText + value.substring(end);
      onChange(newValue);
      addToHistory(newValue);
      
      // Maintain cursor position
      setTimeout(() => {
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
        textarea.focus();
      }, 0);
    }
  };

  // Preview function to render formatted text
  const renderPreview = (text: string) => {
    return text
      // Bold: *text* 
      .replace(/\*([^*]+)\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
      // Underline: `text`
      .replace(/`([^`]+)`/g, '<u class="underline decoration-2 underline-offset-2">$1</u>')
      // Highlights: |color|text|color|
      .replace(/\|(\w+)\|([^|]+)\|(\w+)\|/g, (match, color1, text, color2) => {
        if (color1 === color2) {
          const colorClass = highlightColors.find(c => c.value === color1)?.class || 'bg-yellow-200 text-yellow-900';
          return `<span class="${colorClass} px-1 rounded">${text}</span>`;
        }
        return match;
      })
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'b':
          e.preventDefault();
          insertFormatting({ type: 'bold' });
          break;
        case 'u':
          e.preventDefault();
          insertFormatting({ type: 'underline' });
          break;
      }
    }
  };

  return (
    <div className={cn("diary-editor-container", className)}>
      {/* Formatting Toolbar */}
      <div className="diary-toolbar border-b bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-3 rounded-t-lg border border-amber-200/50">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2 border-amber-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting({ type: 'bold' })}
              className="h-8 w-8 p-0 hover:bg-amber-100"
              title="Bold (*text*)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting({ type: 'underline' })}
              className="h-8 w-8 p-0 hover:bg-amber-100"
              title="Underline (`text`)"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          {/* Highlight Colors */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2 border-amber-200">
            <Highlighter className="h-4 w-4 text-amber-600 mr-1" />
            {highlightColors.slice(0, 4).map(color => (
              <Button
                key={color.value}
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting({ type: 'highlight', color: color.value })}
                className={cn(
                  "h-6 w-6 p-0 rounded-full border-2 border-white shadow-sm",
                  color.class
                )}
                title={`Highlight ${color.name} (|${color.value}|text|${color.value}|)`}
              />
            ))}
          </div>

          {/* History Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="h-8 w-8 p-0 hover:bg-amber-100"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="h-8 w-8 p-0 hover:bg-amber-100"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Format Guide */}
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          <strong>Quick Guide:</strong> *bold* • `underline` • |yellow|highlight|yellow| • Ctrl+B, Ctrl+U for shortcuts
        </div>
      </div>

      {/* Text Area with Handwriting Style */}
      <div className={cn("relative notebook-page", className)}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "diary-textarea w-full min-h-[400px] p-6 resize-none border-none",
            "bg-gradient-to-b from-amber-50/30 to-orange-50/30",
            "handwriting-font text-lg leading-8 text-slate-800",
            "focus:outline-none focus:ring-0",
            "placeholder:text-amber-600/60 placeholder:italic",
            "diary-paper-lines"
          )}
          style={{
            fontFamily: "'Caveat', 'Dancing Script', cursive, 'Georgia', serif",
            lineHeight: '2rem',
            letterSpacing: '0.5px'
          }}
        />
        
        {/* Live Preview Overlay (optional - can be toggled) */}
        {value && (
          <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="h-full p-6 bg-white/90 rounded-b-lg overflow-auto">
              <div 
                className="handwriting-font text-lg leading-8"
                dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Character count and formatting tips */}
      <div className="diary-footer bg-gradient-to-r from-amber-50/50 to-orange-50/50 px-4 py-2 border-t border-amber-200/50 rounded-b-lg text-xs text-amber-700 flex justify-between items-center">
        <div>
          {value.length} characters
        </div>
        <div>
          Select text and use toolbar for formatting
        </div>
      </div>
    </div>
  );
};

export default DiaryTextEditor;
