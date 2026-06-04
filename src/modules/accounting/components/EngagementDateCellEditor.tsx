import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { ICellEditorParams } from 'ag-grid-community'
import { toEngagementDateInput } from '../utils/engagementDateInput'

const EngagementDateCellEditor = forwardRef((
  props: ICellEditorParams<unknown, string | null | undefined>,
  ref
) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(() => toEngagementDateInput(props.value) || '')

  useImperativeHandle(ref, () => ({
    getValue: () => toEngagementDateInput(value),
    afterGuiAttached: () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }))

  return (
    <input
      ref={inputRef}
      type="date"
      className="w-full h-full min-h-[2rem] px-2 text-sm border border-border rounded-md bg-white"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  )
})

EngagementDateCellEditor.displayName = 'EngagementDateCellEditor'

export default EngagementDateCellEditor
