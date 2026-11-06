'use client';

/** Submit button that asks for confirmation first (used for deletes). Works with `formAction` server actions. */
export default function ConfirmButton({
  message,
  className,
  children,
  formAction,
  name,
  value,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
