import { FC } from 'react'
import { Link } from 'react-router-dom'
import { ResourceDetail } from '../lib/resources/resources'

const cardClass =
  'bg-white p-lg rounded-lg shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1 block no-underline text-inherit'

const ResourceCard: FC<{ resource: ResourceDetail }> = ({ resource }) => {
  const body = (
    <>
      <span className="pill mb-md">
        {resource.categoryLabel}
      </span>
      <h3 className="text-xl font-semibold text-primary mb-sm">
        {resource.title}
      </h3>
      <p className="text-text-light text-[0.9375rem] leading-relaxed mb-sm">
        {resource.shortDescription}
      </p>
      {resource.fileSize && (
        <p className="text-sm text-text-light m-0">
          File size: {resource.fileSize}
        </p>
      )}
    </>
  )

  if (resource.externalUrl) {
    return (
      <a
        href={resource.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {body}
      </a>
    )
  }

  return (
    <Link to={`/resources/${resource.slug}`} className={cardClass}>
      {body}
    </Link>
  )
}

export default ResourceCard
