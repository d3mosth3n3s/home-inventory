import { useState } from "react";

export const ADD_NEW = "__add_new__";

export default function useEditableOptions(initial, onSelect) {
  const [options, setOptions] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const handleChange = (value) =>
    value === ADD_NEW ? setAdding(true) : onSelect(value);

  const confirm = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setOptions((prev) => [...prev, trimmed]);
    onSelect(trimmed);
    setText("");
    setAdding(false);
  };

  // used when a scan returns a category that isn't in the list yet
  const ensure = (value) =>
    setOptions((prev) => (prev.includes(value) ? prev : [...prev, value]));

  return { options, adding, text, setText, handleChange, confirm, ensure };
}