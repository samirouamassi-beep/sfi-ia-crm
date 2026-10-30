"use client";

import type { ComponentProps } from "react";
import { Button } from "./ui";

/** Bouton de soumission avec confirmation native (suppression…). */
export function ConfirmButton({ message, ...props }: ComponentProps<typeof Button> & { message: string }) {
  return (
    <Button
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    />
  );
}
