import React from 'react';
import { X, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';

function TabContainer({ title, icon: Icon, onClose, children, actions }) {
  return (
    <div className="h-full bg-terminal-panel border border-terminal-border rounded-lg flex flex-col overflow-hidden shadow-lg">
      <div className="bg-terminal-panel border-b border-terminal-border px-4 py-3 flex items-center justify-between drag-handle cursor-move">
        <div className="flex items-center gap-3">
          <GripHorizontal size={16} className="text-terminal-muted" />
          {Icon && <Icon size={18} className="text-terminal-accent" />}
          <h3 className="text-sm font-semibold text-terminal-text">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-terminal-border text-terminal-muted hover:text-terminal-text transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  );
}

export default TabContainer;
