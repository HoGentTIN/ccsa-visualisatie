import * as TabsPrimitive from '@radix-ui/react-tabs'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className = '', ...props }: TabsPrimitive.TabsListProps) {
    return (
        <TabsPrimitive.List
            className={`flex gap-1 rounded-lg bg-neutral-100 border border-neutral-200 p-1 ${className}`}
            {...props}
        />
    )
}

export function TabsTrigger({ className = '', ...props }: TabsPrimitive.TabsTriggerProps) {
    return (
        <TabsPrimitive.Trigger
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold text-neutral-500 transition-all
        data-[state=active]:bg-white data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm ${className}`}
            {...props}
        />
    )
}

export function TabsContent({ className = '', ...props }: TabsPrimitive.TabsContentProps) {
    return (
        <TabsPrimitive.Content className={`mt-4 ${className}`} {...props} />
    )
}