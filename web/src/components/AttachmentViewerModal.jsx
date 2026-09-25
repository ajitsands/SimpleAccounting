import React from 'react';
import { X, Download, FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function AttachmentViewerModal({ attachment, onClose }) {
  if (!attachment) return null;

  const isImage = attachment.file_type && attachment.file_type.startsWith('image/');
  const fileUrl = attachment.file_url || ('/' + attachment.file_path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-md">
                {attachment.file_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'Attachment'} • {attachment.file_type || 'Receipt'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.file_name}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-6 overflow-auto flex items-center justify-center bg-slate-100/60 dark:bg-slate-950/60 min-h-[300px]">
          {isImage ? (
            <img 
              src={fileUrl} 
              alt={attachment.file_name} 
              className="max-h-[65vh] max-w-full rounded-lg shadow-md object-contain border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="text-center py-12 px-6">
              <FileText className="w-16 h-16 text-indigo-400 mx-auto mb-3" />
              <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">{attachment.file_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Document / PDF File</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in New Tab / Download</span>
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
