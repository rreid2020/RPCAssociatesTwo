import { FC } from 'react'
import { Link } from 'react-router-dom'
import { ResourceDetail } from '../lib/resources/resources'

const ResourceCard: FC<{ resource: ResourceDetail }> = ({ resource }) => {
  const body = (
    <>
      <span className="name">{resource.categoryLabel}</span>
      <h3>{resource.title}</h3>
      <p className="intro">{resource.shortDescription}</p>
      {resource.fileSize ? (
        <p className="intro" style={{ marginBottom: 0 }}>File size: {resource.fileSize}</p>
      ) : null}
    </>
  )

  if (resource.externalUrl) {
    return (
      <a
        href={resource.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="service-card"
      >
        {body}
      </a>
    )
  }

  return (
    <Link to={`/resources/${resource.slug}`} className="service-card">
      {body}
    </Link>
  )
}

export default ResourceCard
