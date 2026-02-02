import { FC, ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

interface MarketingLayoutProps {
  children: ReactNode
}

const MarketingLayout: FC<MarketingLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

export default MarketingLayout
