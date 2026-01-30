'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Heading2,
  Heading3,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { validateImageSize } from '@/lib/utils/imageValidation';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  entryType: 'short' | 'long';
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  imageNotes?: string;
  onImageNotesChange?: (notes: string) => void;
}

const STRATEGY_TEMPLATE = `<h2>Entry Condition</h2>
<ul>
  <li>Specify entry conditions for this strategy</li>
</ul>

<h2>SL (Stop Loss)</h2>
<ul>
  <li>Define stop loss placement rules</li>
</ul>

<h2>TP (Take Profit)</h2>
<ul>
  <li>Define take profit targets</li>
</ul>

<h2>Instrument</h2>
<ul>
  <li>Recommended currency pairs or assets</li>
</ul>

<h2>Remarks</h2>
<ul>
  <li>Additional notes, warnings, or tips</li>
</ul>`;

export function TiptapEditor({ content, onChange, placeholder, entryType, images = [], onImagesChange, imageNotes = '', onImageNotesChange }: TiptapEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>(images);

  // Define handleImageFile before useEditor so it's available in handlePaste
  const handleImageFile = async (file: File) => {
    // Validate file size before converting
    if (file.size > 500 * 1024) {
      alert(`Image size (${Math.round(file.size / 1024)}KB) exceeds maximum allowed size (500KB). Please use a smaller image.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      // Validate base64 size
      const validation = validateImageSize(base64);
      if (!validation.valid) {
        alert(`Image size (${validation.sizeKB}KB) exceeds maximum allowed size (500KB). Please compress the image.`);
        return;
      }

      // Add to images array (not in editor content)
      const newImages = [...uploadedImages, base64];
      setUploadedImages(newImages);
      if (onImagesChange) {
        onImagesChange(newImages);
      }
    };
    reader.readAsDataURL(file);
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 border rounded-md',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        // Check if clipboard contains an image
        let hasImage = false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            hasImage = true;
            event.preventDefault(); // Only prevent default for images
            const file = items[i].getAsFile();
            if (file) {
              handleImageFile(file);
            }
            return true; // Image handled, stop here
          }
        }
        
        // No image found - let default text paste behavior happen
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync images state with parent
  useEffect(() => {
    setUploadedImages(images);
  }, [images]);

  const insertTemplate = () => {
    if (editor) {
      editor.commands.setContent(STRATEGY_TEMPLATE);
    }
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      handleImageFile(file);
    };

    input.click();
  };

  const setLink = () => {
    if (!linkUrl) return;

    if (editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }

    setLinkUrl('');
    setIsLinkDialogOpen(false);
  };

  const unsetLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 flex-wrap border rounded-md p-2 bg-muted/50">
        {/* Template Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTemplate}
          title="Insert Strategy Template"
          className="h-8 px-2"
        >
          <FileText className="h-4 w-4 mr-1" />
          Template
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className="h-8 w-8 p-0"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
          className="h-8 w-8 p-0"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Code */}
        <Button
          type="button"
          variant={editor.isActive('code') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Code"
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link */}
        <Button
          type="button"
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => {
            if (editor.isActive('link')) {
              unsetLink();
            } else {
              setIsLinkDialogOpen(true);
            }
          }}
          title="Link"
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {/* Image */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
          title="Upload Image (max 500KB)"
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Link Dialog */}
      {isLinkDialogOpen && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-1 text-sm border rounded-md"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setLink();
              }
              if (e.key === 'Escape') {
                setIsLinkDialogOpen(false);
                setLinkUrl('');
              }
            }}
            autoFocus
          />
          <Button type="button" size="sm" onClick={setLink}>
            Set Link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsLinkDialogOpen(false);
              setLinkUrl('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Two-column layout: Visual content on left, Main strategy on right */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        {/* Left: Images + Notes Section */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            <span>📸 Visual Examples ({uploadedImages.length})</span>
          </div>
          
          {/* Image Gallery */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2 bg-muted/20">
            {uploadedImages.length === 0 ? (
              <div className="text-xs text-muted-foreground p-4 text-center">
                No images yet.<br />
                Click image icon or paste (Ctrl+V)
              </div>
            ) : (
              uploadedImages.map((src, index) => (
                <div key={index} className="relative group border rounded-md overflow-hidden">
                  <img 
                    src={src} 
                    alt={`Upload ${index + 1}`}
                    className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      // Open in modal or new tab
                      const win = window.open();
                      if (win) {
                        win.document.write(`<img src="${src}" style="max-width:100%; height:auto;" />`);
                      }
                    }}
                  />
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newImages = uploadedImages.filter((_, i) => i !== index);
                      setUploadedImages(newImages);
                      if (onImagesChange) {
                        onImagesChange(newImages);
                      }
                    }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to enlarge
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Image Notes/Descriptions */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Chart Notes & Annotations
            </label>
            <textarea
              value={imageNotes}
              onChange={(e) => onImageNotesChange?.(e.target.value)}
              placeholder="Add notes about the charts above (e.g., key levels, patterns, indicators used)..."
              className="w-full h-32 px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Describe what to look for in the charts
            </p>
          </div>
        </div>

        {/* Right: Main Strategy Content */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            📝 Strategy Details
          </div>
          <EditorContent editor={editor} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {entryType === 'short' ? '📉 SHORT Entry Strategy' : '📈 LONG Entry Strategy'} • 
        Max image size: 500KB • 
        Tip: Use Insert Template button to start or paste images with Ctrl+V
      </p>
    </div>
  );
}
