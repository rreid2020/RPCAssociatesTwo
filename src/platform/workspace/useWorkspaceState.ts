import { useWorkspaceContext } from '../../domains/Workspace/context/WorkspaceContextProvider'

export function useWorkspaceState () {
  const { workspaceId, setWorkspaceId } = useWorkspaceContext()
  return {
    workspaceId,
    setWorkspaceId
  }
}
