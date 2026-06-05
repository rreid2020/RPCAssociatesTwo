import { FC } from 'react'
import { NavLink } from 'react-router-dom'
import { usePermission } from '../../../platform/permissions/usePermission'

const basePath = '/portal/accounting/company-profile'

type CompanyProfileTabsProps = {
  entityTabLabel: string
}

export const CompanyProfileTabs: FC<CompanyProfileTabsProps> = ({ entityTabLabel }) => {
  const canViewRbac = usePermission('rbac.read')
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `btn text-sm py-2 px-3 ${isActive ? 'btn--primary' : 'btn--secondary'}`

  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      <NavLink to={basePath} end className={tabClass}>
        Business/Firm Details
      </NavLink>
      <NavLink to={`${basePath}/employees`} className={tabClass}>
        Invite Employees
      </NavLink>
      <NavLink to={`${basePath}/entities`} className={tabClass}>
        {entityTabLabel}
      </NavLink>
      {canViewRbac && (
        <NavLink to={`${basePath}/roles-and-permissions`} className={tabClass}>
          Roles & Permissions
        </NavLink>
      )}
    </div>
  )
}
