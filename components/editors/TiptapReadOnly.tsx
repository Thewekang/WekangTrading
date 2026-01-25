'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { useEffect } from 'react';

interface TiptapReadOnlyProps {
  content: string;
  className?: string;
}

export function TiptapReadOnly({ content, className = '' }: TiptapReadOnlyProps) {
  // Sanitize content before rendering
  const sanitizedContent = sanitizeHtml(content);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md cursor-pointer hover:opacity-90 transition-opacity',
        },
      }),
    ],
    content: sanitizedContent,
    editable: false,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none ${className}`,
      },
    },
  });

  // Update content when it changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(sanitizeHtml(content));
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div 
      className="tiptap-readonly"
      onClick={(e) => {
        // Handle image click for full-screen view
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
          const img = target as HTMLImageElement;
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer';
          modal.onclick = () => modal.remove();
          
          const fullImg = document.createElement('img');
          fullImg.src = img.src;
          fullImg.alt = img.alt;
          fullImg.className = 'max-w-[90vw] max-h-[90vh] object-contain';
          
          modal.appendChild(fullImg);
          document.body.appendChild(modal);
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
