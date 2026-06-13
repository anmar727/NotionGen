"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode };

function collectOptions(children: React.ReactNode): React.ReactElement[] {
  const options: React.ReactElement[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) options.push(child);
    if ((child.props as { children?: React.ReactNode }).children) {
      options.push(...collectOptions((child.props as { children?: React.ReactNode }).children));
    }
  });
  return options;
}

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <select className={cn("h-9 w-full rounded-md border border-input bg-background px-3 text-sm", className)} {...props}>
      {collectOptions(children).map((item) => (
        <option key={String(item.props.value)} value={item.props.value}>{item.props.children}</option>
      ))}
    </select>
  );
}

export function SelectTrigger({ children }: { children?: React.ReactNode; className?: string }) {
  return <>{children}</>;
}

export function SelectValue() {
  return null;
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ children }: { value: string; children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectSeparator() {
  return null;
}
