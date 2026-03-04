import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue { activeTab: string; setActiveTab: (v: string) => void; }
const TabsContext = React.createContext<TabsContextValue | null>(null);
function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs must be within <Tabs>");
  return ctx;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
}

function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const activeTab = value ?? internal;
  const setActiveTab = React.useCallback((v: string) => { setInternal(v); onValueChange?.(v); }, [onValueChange]);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex h-10 items-center justify-start gap-1 rounded-xl bg-zinc-800/50 p-1", className)} role="tablist" {...props} />;
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { value: string; }
function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;
  return (
    <button
      role="tab" aria-selected={isActive}
      className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all", isActive ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200", className)}
      onClick={() => setActiveTab(value)} {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> { value: string; }
function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { activeTab } = useTabs();
  if (activeTab !== value) return null;
  return <div className={cn("mt-4", className)} role="tabpanel" {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
