/** @format */

import React from "react";
import clsx from "clsx";

export default function Spinner({ size = "md", className }) {
  const s = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }[size];
  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-2 border-border border-t-accent",
        s,
        className,
      )}
    />
  );
}
