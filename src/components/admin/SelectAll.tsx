'use client';

/** "Select all" checkbox for a list whose row checkboxes use `form="<form id>"` and `name="ids"`. */
export default function SelectAll({ form, label = 'Select all' }: { form: string; label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-mute">
      <input
        type="checkbox"
        className="h-4 w-4 accent-[rgb(var(--c-gold))]"
        onChange={(e) => {
          const on = e.currentTarget.checked;
          document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="ids"]`).forEach((i) => {
            if (i.getAttribute('form') === form) i.checked = on;
          });
        }}
      />
      {label}
    </label>
  );
}
