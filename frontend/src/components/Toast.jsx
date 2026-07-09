/** @format */

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import clsx from "clsx";

const ToastContext = createContext(null);

let _id = 0;
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "info") => {
    const id = ++_id;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl pointer-events-auto",
              t.type === "success" && "bg-surface border-up/30 text-up",
              t.type === "error" && "bg-surface border-down/30 text-down",
              t.type === "info" && "bg-surface border-info/30 text-info",
            )}
          >
            {t.type === "success" && (
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            )}
            {t.type === "error" && (
              <XCircle size={16} className="mt-0.5 flex-shrink-0" />
            )}
            {t.type === "info" && (
              <Info size={16} className="mt-0.5 flex-shrink-0" />
            )}
            <p className="flex-1 text-sm text-white">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-muted hover:text-white flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
