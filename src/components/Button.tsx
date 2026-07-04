import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className = "", disabled, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold " +
    "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300";

  const enabledStyles = "bg-black text-white hover:bg-gray-800";
  const disabledStyles = "bg-gray-300 text-gray-600 cursor-not-allowed";

  return (
    <button
      {...props}
      disabled={disabled}
      className={`${base} ${disabled ? disabledStyles : enabledStyles} ${className}`}
    />
  );
}
