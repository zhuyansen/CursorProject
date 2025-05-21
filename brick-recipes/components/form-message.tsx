export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-green-700 dark:text-green-500 border-l-2 border-green-700 dark:border-green-500 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="text-red-700 dark:text-red-500 border-l-2 border-red-700 dark:border-red-500 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="text-foreground border-l-2 border-foreground px-4 py-3 bg-gray-50 dark:bg-gray-900/20 rounded">
          {message.message}
        </div>
      )}
    </div>
  );
} 