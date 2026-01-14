/**
 * Inserts text at the current cursor position in a textarea
 * @param textarea - The textarea element (from ref.current)
 * @param textToInsert - The text to insert
 * @param currentValue - The current value of the textarea
 * @param setValue - Function to update the textarea value
 * @returns The new value with text inserted
 */
export function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  textToInsert: string,
  currentValue: string,
  setValue: (value: string) => void
): void {
  if (!textarea) {
    // Fallback: append to end if no textarea ref
    setValue(currentValue + "\n" + textToInsert);
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  // Insert text at cursor position
  const newValue =
    currentValue.substring(0, start) +
    textToInsert +
    currentValue.substring(end);

  setValue(newValue);

  // Restore focus and move cursor after inserted text
  setTimeout(() => {
    textarea.focus();
    const newCursorPos = start + textToInsert.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
}
