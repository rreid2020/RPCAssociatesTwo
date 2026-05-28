import { FC } from 'react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import UpgradePrompt from '../../components/UpgradePrompt'
import { TaxGPTPage } from '../../modules/taxgpt'

const TaxGPT: FC = () => {
  const hasAccess = useFeatureAccess('taxgpt')

  return (
    <>
      <SEO
        title="TaxGPT | Client Portal"
        description="AI-powered tax research and guidance with instant answers to complex tax questions."
        canonical="/portal/taxgpt"
      />
      <ClientPortalShell>
        <div>
          {!hasAccess ? <UpgradePrompt feature="TaxGPT" /> : <TaxGPTPage />}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxGPT
