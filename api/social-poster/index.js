/**
 * Serverless function to handle Sanity webhooks and post to LinkedIn and Twitter
 * 
 * Deploy this to:
 * - Vercel (recommended): https://vercel.com
 * - Netlify Functions: https://netlify.com
 * - Digital Ocean Functions: https://docs.digitalocean.com/products/functions/
 * - AWS Lambda
 * 
 * Environment variables needed:
 * - LINKEDIN_CLIENT_ID
 * - LINKEDIN_CLIENT_SECRET
 * - LINKEDIN_ACCESS_TOKEN (or use OAuth flow)
 * - TWITTER_API_KEY
 * - TWITTER_API_SECRET
 * - TWITTER_ACCESS_TOKEN
 * - TWITTER_ACCESS_TOKEN_SECRET
 * - SANITY_WEBHOOK_SECRET (for webhook verification)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify webhook secret (optional but recommended)
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET
  if (webhookSecret && req.headers['x-sanity-secret'] !== webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { body } = req
    const event = body

    // Only process published posts
    if (event.type !== 'mutation' || !event.mutations) {
      return res.status(200).json({ message: 'Not a mutation event' })
    }

    // Check if a post was published
    const publishedPost = event.mutations.find(mutation => 
      mutation.create && 
      (mutation.create._type === 'post' || mutation.create._type === 'article') &&
      mutation.create.publishedAt
    )

    if (!publishedPost) {
      return res.status(200).json({ message: 'No published post found' })
    }

    const post = publishedPost.create

    // Build the post content
    const postTitle = post.title
    const postExcerpt = post.excerpt || ''
    const postUrl = `https://rpcassociates.co/articles/${post.slug?.current || post.slug}`
    
    // Create social media messages
    const linkedInMessage = createLinkedInPost(postTitle, postExcerpt, postUrl)
    const twitterMessage = createTwitterPost(postTitle, postExcerpt, postUrl)

    // Post to both platforms
    const results = await Promise.allSettled([
      postToLinkedIn(linkedInMessage),
      postToTwitter(twitterMessage)
    ])

    // Return results
    const response = {
      success: true,
      linkedIn: results[0].status === 'fulfilled' 
        ? { success: true, postId: results[0].value }
        : { success: false, error: results[0].reason?.message },
      twitter: results[1].status === 'fulfilled'
        ? { success: true, tweetId: results[1].value }
        : { success: false, error: results[1].reason?.message }
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

/**
 * Create LinkedIn post content
 */
function createLinkedInPost(title, excerpt, url) {
  const maxLength = 3000 // LinkedIn post limit
  let content = `${title}\n\n${excerpt}\n\nRead more: ${url}`
  
  if (content.length > maxLength) {
    content = `${title}\n\nRead more: ${url}`
  }
  
  return content
}

/**
 * Create Twitter/X post content
 */
function createTwitterPost(title, excerpt, url) {
  const maxLength = 280 // Twitter character limit
  const urlLength = 23 // Twitter counts URLs as 23 chars
  const availableChars = maxLength - urlLength - 4 // "..." + space + URL
  
  let content = title
  if (content.length > availableChars) {
    content = title.substring(0, availableChars - 3) + '...'
  }
  
  return `${content} ${url}`
}

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(message) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  
  if (!accessToken) {
    throw new Error('LinkedIn access token not configured')
  }

  // Get your LinkedIn person URN (you'll need to fetch this once)
  const personUrn = process.env.LINKEDIN_PERSON_URN || 'YOUR_PERSON_URN'

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: `urn:li:person:${personUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: message
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.id
}

/**
 * Post to Twitter/X using Twitter API v2
 * 
 * IMPORTANT: Twitter API requires OAuth 1.0a signing which is complex.
 * Recommended: Use the 'twitter-api-v2' package (see package.json)
 * 
 * Install: npm install twitter-api-v2
 */
async function postToTwitter(message) {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('Twitter credentials not configured')
  }

  // Try to use twitter-api-v2 library if available
  try {
    // Dynamic import for serverless environments
    const { TwitterApi } = await import('twitter-api-v2')
    
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    })

    const tweet = await client.v2.tweet(message)
    return tweet.data.id
  } catch (importError) {
    // If library not available, provide helpful error
    throw new Error(
      'Twitter API requires OAuth 1.0a signing. ' +
      'Please install twitter-api-v2: npm install twitter-api-v2 ' +
      'Or use Zapier/Make for a no-code solution. ' +
      `Error: ${importError.message}`
    )
  }
}

