import './style.css';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { html } from '@codemirror/lang-html';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

const initialHtml = `<div class="container mt-4">
  <div class="row">
    <div class="col-12 text-center">
      <h1 class="text-primary mb-3">Bootstrap 5 Preview</h1>
      <p class="lead">リアルタイムプレビューと自動補完機能つき！</p>
    </div>
  </div>
  <div class="row mt-3">
    <div class="col-md-6 mx-auto">
      <div class="card shadow">
        <div class="card-body">
          <h5 class="card-title">Card title</h5>
          <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
          <a href="#" class="btn btn-primary">Go somewhere</a>
        </div>
      </div>
    </div>
  </div>
</div>`;

// Bootstrap 5 classes for autocomplete
const bsClasses = [
  'container', 'container-fluid', 'row', 'col', 'col-12', 'col-md-6', 'col-lg-4',
  'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5',
  'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5',
  'pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5', 'pb-1', 'pb-2', 'pb-3', 'pb-4', 'pb-5',
  'text-center', 'text-start', 'text-end', 'text-primary', 'text-secondary', 'text-success', 'text-danger', 'text-warning', 'text-info', 'text-light', 'text-dark',
  'bg-primary', 'bg-secondary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-light', 'bg-dark',
  'btn', 'btn-primary', 'btn-secondary', 'btn-success', 'btn-danger', 'btn-warning', 'btn-info', 'btn-light', 'btn-dark', 'btn-outline-primary',
  'card', 'card-body', 'card-title', 'card-text', 'card-header', 'card-footer',
  'shadow', 'shadow-sm', 'shadow-lg', 'rounded', 'rounded-circle', 'rounded-pill',
  'd-flex', 'd-none', 'd-block', 'd-inline-block', 'justify-content-center', 'justify-content-between', 'align-items-center',
  'form-control', 'form-label', 'form-select', 'form-check', 'form-check-input', 'form-check-label', 'input-group', 'input-group-text',
  'navbar', 'navbar-expand-lg', 'navbar-light', 'bg-light', 'navbar-brand', 'navbar-nav', 'nav-item', 'nav-link'
].map(c => ({ label: c, type: "class" }));

// Custom autocompletion for class attributes
function bsClassCompletion(context) {
  let word = context.matchBefore(/class=["'][^"']*$/);
  if (!word) return null;
  let lastWordMatch = context.matchBefore(/[\w-]*$/);
  
  if (word && word.from === word.to && !context.explicit) return null;

  return {
    from: lastWordMatch ? lastWordMatch.from : context.pos,
    options: bsClasses,
    validFor: /^[\w-]*$/
  };
}

// Custom theme (Dark blue bg, green text)
const customTheme = EditorView.theme({
  "&": {
    color: "#00ff00",
    backgroundColor: "#0b1a2a"
  },
  ".cm-content": {
    caretColor: "#00ff00"
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#00ff00" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": { backgroundColor: "rgba(0, 255, 0, 0.3)" },
  ".cm-panels": { backgroundColor: "#07121d", color: "#00ff00" },
  ".cm-panels.cm-panels-top": { borderBottom: "2px solid #1a3a5a" },
  ".cm-panels.cm-panels-bottom": { borderTop: "2px solid #1a3a5a" },
  ".cm-searchMatch": {
    backgroundColor: "#72a1ff59",
    outline: "1px solid #457dff"
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#6199ff2f"
  },
  ".cm-activeLine": { backgroundColor: "rgba(0, 255, 0, 0.05)" },
  ".cm-selectionMatch": { backgroundColor: "#aafe661a" },
  "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: "rgba(0, 255, 0, 0.2)"
  },
  ".cm-gutters": {
    backgroundColor: "#07121d",
    color: "#008800",
    borderRight: "1px solid #1a3a5a"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#0b1a2a",
    color: "#00ff00"
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
    color: "#00ff00"
  },
  ".cm-tooltip": {
    border: "1px solid #1a3a5a",
    backgroundColor: "#0b1a2a",
    color: "#00ff00"
  },
  ".cm-tooltip .cm-tooltip-arrow:before": {
    borderTopColor: "transparent",
    borderBottomColor: "transparent"
  },
  ".cm-tooltip .cm-tooltip-arrow:after": {
    borderTopColor: "#0b1a2a",
    borderBottomColor: "#0b1a2a"
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: "#1a3a5a",
      color: "#00ff00"
    }
  }
}, { dark: true });

const state = EditorState.create({
  doc: initialHtml,
  extensions: [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion({
      override: [bsClassCompletion]
    }),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab
    ]),
    html({ autoCloseTags: true }),
    customTheme,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        updatePreview(update.state.doc.toString());
      }
    })
  ]
});

const view = new EditorView({
  state,
  parent: document.getElementById('editor-mount')
});

const previewFrame = document.getElementById('preview-frame');

function updatePreview(htmlContent) {
  const finalHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { padding-top: 10px; }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script>
    </body>
    </html>
  `;
  
  const blob = new Blob([finalHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  if (previewFrame.src) {
    URL.revokeObjectURL(previewFrame.src);
  }
  previewFrame.src = url;
}

// Initial preview update
updatePreview(initialHtml);

// Copy button functionality
const copyBtn = document.getElementById('copy-btn');
copyBtn.addEventListener('click', () => {
  const content = view.state.doc.toString();
  navigator.clipboard.writeText(content).then(() => {
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  });
});

// Clear button functionality
const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', () => {
  if (confirm('エディタの内容をすべてクリアしますか？')) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: '' }
    });
  }
});

// Simple resizer logic (for mouse and touch)
const resizer = document.getElementById('resizer');
const previewContainer = document.getElementById('preview-container');
const editorContainer = document.getElementById('editor-container');
const app = document.getElementById('app');

let isResizing = false;

const startResize = (e) => {
  isResizing = true;
  document.body.style.cursor = 'row-resize';
  app.style.userSelect = 'none'; // prevent selection
  if (previewFrame) previewFrame.style.pointerEvents = 'none'; // allow dragging over iframe
};

const endResize = () => {
  if (!isResizing) return;
  isResizing = false;
  document.body.style.cursor = '';
  app.style.userSelect = '';
  if (previewFrame) previewFrame.style.pointerEvents = '';
};

const resize = (e) => {
  if (!isResizing) return;
  let clientY = e.clientY;
  if (e.type.includes('touch')) {
    clientY = e.touches[0].clientY;
  }
  
  const containerHeight = app.clientHeight;
  const newPreviewHeight = clientY;
  
  if (newPreviewHeight > 50 && newPreviewHeight < containerHeight - 50) {
    previewContainer.style.flex = `0 0 ${newPreviewHeight}px`;
    editorContainer.style.flex = '1 1 auto';
  }
};

resizer.addEventListener('mousedown', startResize);
resizer.addEventListener('touchstart', startResize, { passive: false });

window.addEventListener('mousemove', resize);
window.addEventListener('touchmove', resize, { passive: false });

window.addEventListener('mouseup', endResize);
window.addEventListener('touchend', endResize);
