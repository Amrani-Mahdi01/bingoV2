"use client";

import * as React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Undo2,
  Redo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** When true, switches text direction to RTL for Arabic input. */
  rtl?: boolean;
  className?: string;
}

/**
 * Minimal Tiptap-based rich text editor for admin forms.
 * Stores HTML so the storefront can render with `dangerouslySetInnerHTML`
 * (or a proper sanitiser later).
 *
 * Toolbar: bold / italic / strike, H2 / H3, bullet / ordered list,
 * blockquote, undo / redo. Bilingual ready — pass `rtl` to flip layout.
 */
export function RichEditor({
  value,
  onChange,
  placeholder,
  rtl = false,
  className,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Tiptap returns "<p></p>" for an empty doc — normalize to "".
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[220px] px-3 py-2.5 focus:outline-none",
          // Tighten heading vs paragraph spacing for the dense admin form.
          "prose-headings:font-sans prose-headings:font-semibold",
          "prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2",
          // Lists: marker stays INSIDE the <li> content box (never
          // escapes the editor; flips automatically with dir="rtl").
          // Tiptap's schema wraps each <li>'s content in a block <p>,
          // which would put the marker on its own line — flatten the
          // inner <p> to inline so marker + text share a line.
          "[&_ul]:!pl-0 [&_ol]:!pl-0 [&_ul]:!ps-2 [&_ol]:!ps-2",
          "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:list-inside [&_ol]:list-inside",
          "[&_li]:my-0.5 [&_li>p]:inline [&_li>p]:!m-0",
          // Blockquote rule on the inline-start edge so it flips with RTL.
          "[&_blockquote]:!border-l-0 [&_blockquote]:!border-r-0 [&_blockquote]:!border-s-4 [&_blockquote]:!ps-4",
          // RTL: force right-alignment on the editor AND on every block
          // child Tiptap creates (<p>/<h2>/<h3>/<li>/<blockquote>).
          // Prose's reset can leave paragraphs at text-align: start which,
          // combined with the editor's container alignment, still flushes
          // the caret left. Explicit text-right beats the cascade.
          rtl &&
            "text-right [&_p]:text-right [&_h1]:text-right [&_h2]:text-right [&_h3]:text-right [&_li]:text-right [&_blockquote]:text-right"
        ),
        // Inline style as a second guard: forces `direction: rtl` on the
        // contenteditable so the caret starts at the right edge and lines
        // wrap correctly even when prose CSS doesn't honour the dir attr.
        style: rtl
          ? "min-height: 220px; direction: rtl; text-align: right;"
          : "min-height: 220px",
        dir: rtl ? "rtl" : "ltr",
        lang: rtl ? "ar" : "fr",
      },
    },
    // Avoid SSR hydration mismatch — Tiptap renders in client only.
    immediatelyRender: false,
  });

  // External value changes (e.g. resetting the form) propagate into editor.
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current !== next && next !== "<p></p>") {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        "rounded-md border border-zinc-200 bg-white focus-within:border-zinc-400",
        className
      )}
    >
      <Toolbar editor={editor} />
      <div className="relative border-t border-zinc-100">
        <EditorContent editor={editor} />
        {editor && editor.isEmpty && placeholder ? (
          // Absolute overlay so it never affects the editor's measured
          // height — sits at the top-left of the content area regardless
          // of the editor's min-height.
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 px-3 py-2.5 text-sm text-zinc-400",
              rtl && "text-end"
            )}
            dir={rtl ? "rtl" : "ltr"}
          >
            {placeholder}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return <div className="h-9" aria-hidden="true" />;
  }
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1">
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Gras"
      >
        <Bold className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italique"
      >
        <Italic className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Barré"
      >
        <Strikethrough className="size-3.5" />
      </ToolButton>

      <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden="true" />

      <ToolButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
        label="Titre 2"
      >
        <Heading2 className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive("heading", { level: 3 })}
        label="Titre 3"
      >
        <Heading3 className="size-3.5" />
      </ToolButton>

      <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden="true" />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Liste à puces"
      >
        <List className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Liste numérotée"
      >
        <ListOrdered className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Citation"
      >
        <Quote className="size-3.5" />
      </ToolButton>

      <span className="ms-auto inline-flex items-center gap-0.5">
        <ToolButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="Annuler"
        >
          <Undo2 className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="Rétablir"
        >
          <Redo2 className="size-3.5" />
        </ToolButton>
      </span>
    </div>
  );
}

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-zinc-100 text-zinc-900"
      )}
    >
      {children}
    </button>
  );
}
