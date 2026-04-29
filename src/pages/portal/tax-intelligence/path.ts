export function getTaxBasePath (pathname: string): '/app/tax-intelligence' | '/portal/tax-intelligence' {
  if (pathname.startsWith('/portal/')) return '/portal/tax-intelligence'
  return '/app/tax-intelligence'
}
