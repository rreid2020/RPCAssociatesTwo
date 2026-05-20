import { FC, ReactNode } from 'react'

interface DataTableProps {
  children: ReactNode
}

const DataTable: FC<DataTableProps> = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">{children}</table>
  </div>
)

export default DataTable

