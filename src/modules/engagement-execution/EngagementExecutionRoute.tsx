import { useAuth } from '@clerk/clerk-react'
import EngagementExecutionPage from './pages/EngagementExecutionPage'

const EngagementExecutionRoute = () => {
  const { getToken } = useAuth()
  return <EngagementExecutionPage getToken={getToken} />
}

export default EngagementExecutionRoute
