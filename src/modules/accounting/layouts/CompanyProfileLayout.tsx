import { FC } from 'react'
import { NavLink } from 'react-router-dom'

const basePath = '/portal/accounting/company-profile'

type CompanyProfileTabsProps = {
  entityTabLabel: string
}

export const CompanyProfileTabs: FC<CompanyProfileTabsProps> = ({ entityTabLabel }) => {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `btn text-sm py-2 px-3 ${isActive ? 'btn--primary' : 'btn--secondary'}`

  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      <NavLink to={basePath} end className={tabClass}>
        Business/Firm Details
      </NavLink>
      <NavLink to={`${basePath}/entities`} className={tabClass}>
        {entityTabLabel}
      </NavLink>
      <NavLink to={`${basePath}/employees`} className={tabClass}>
        Invite Employees
      </NavLink>
    </div>
  )
}
