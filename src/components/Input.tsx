import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full border rounded-xl px-3 py-2 text-sm outline-none " +
        "hover:border-gray-500 focus:border-black focus:ring-2 focus:ring-gray-200 " +
        (props.className || "")
      }
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full border rounded-xl px-3 py-2 text-sm outline-none min-h-[120px] " +
        "hover:border-gray-500 focus:border-black focus:ring-2 focus:ring-gray-200 " +
        (props.className || "")
      }
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white " +
        "hover:border-gray-500 focus:border-black focus:ring-2 focus:ring-gray-200 " +
        (props.className || "")
      }
    />
  );
}

/* ✅ ADD THIS LINE */
export default Input;
