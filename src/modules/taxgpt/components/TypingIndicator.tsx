export default function TypingIndicator () {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-light shadow-sm">
      <span className="inline-flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </span>
      <span>TaxGPT is drafting a sourced response...</span>
    </div>
  )
}
